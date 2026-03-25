import { renderHome } from "./home.jsx";
import oldMappings from "./old_redirects.json" with { type: "json" };
import { tryResolveAssetUrl, tryResolveLatestJson, tryResolvePluginUrl, tryResolveSchemaUrl } from "./plugins.js";
import { readInfoFile } from "./readInfoFile.js";
import robotsTxt from "./robots.txt";
import styleCSS from "./style.css";
import { LruCache } from "./utils/LruCache.js";
import { getCliInfo } from "./utils/mod.js";
import { r2Get, r2Put } from "./utils/r2Cache.js";

const MAX_MEM_CACHE_BODY_SIZE = 10 * 1024 * 1024; // 10MB

const contentTypes = {
  css: "text/css; charset=utf-8",
  html: "text/html; charset=utf-8",
  json: "application/json; charset=utf-8",
  plain: "text/plain; charset=utf-8",
  wasm: "application/wasm",
  octetStream: "application/octet-stream",
};

export function createRequestHandler() {
  const memoryCache = new LruCache<string, { body: ArrayBuffer; contentType: string }>({ size: 50 });
  return {
    async handleRequest(request: Request, ctx?: ExecutionContext) {
      const url = new URL(request.url);
      const assetUrl = tryResolveAssetUrl(url);
      if (assetUrl != null) {
        return servePlugin(request, assetUrl, ctx);
      }

      const githubUrl = await resolvePluginOrSchemaUrl(url);
      if (githubUrl != null) {
        return servePlugin(request, githubUrl, ctx);
      }

      const userLatestInfo = await tryResolveLatestJson(url);
      if (userLatestInfo != null) {
        if (userLatestInfo === 404) {
          return new Response("Not Found", {
            status: 404,
          });
        } else {
          return createJsonResponse(
            JSON.stringify(userLatestInfo, undefined, 2),
            request,
          );
        }
      }

      if (url.pathname.startsWith("/info.json")) {
        const infoFileData = await readInfoFile();
        return createJsonResponse(
          JSON.stringify(infoFileData, null, 2),
          request,
        );
      }

      if (url.pathname.startsWith("/cli.json")) {
        const cliInfo = await getCliInfo();
        return createJsonResponse(JSON.stringify(cliInfo, null, 2), request);
      }

      if (url.pathname === "/robots.txt") {
        return new Response(robotsTxt, {
          headers: { "content-type": contentTypes.plain },
          status: 200,
        });
      }

      if (url.pathname === "/style.css") {
        return new Response(styleCSS, {
          headers: {
            "content-type": contentTypes.css,
          },
          status: 200,
        });
      }

      if (url.pathname === "/") {
        return renderHome().then((home) =>
          new Response(home, {
            headers: {
              "content-type": contentTypes.html,
            },
            status: 200,
          })
        ).catch((err) =>
          new Response(`${err.toString?.() ?? err}`, {
            headers: {
              "content-type": contentTypes.plain,
            },
            status: 500,
          })
        );
      }

      return create404Response();
    },
  };

  async function servePlugin(request: Request, githubUrl: string, ctx?: ExecutionContext) {
    const result = await resolveBody(githubUrl, ctx);
    return new Response(result.body, {
      headers: {
        "content-type": result.contentType,
        "Access-Control-Allow-Origin": getAccessControlAllowOrigin(request),
      },
      status: result.status,
    });
  }

  async function resolveBody(
    githubUrl: string,
    ctx?: ExecutionContext,
  ): Promise<{ body: ArrayBuffer | ReadableStream | null; status: number; contentType: string }> {
    // L1: in-memory cache
    const cached = memoryCache.get(githubUrl);
    if (cached != null) {
      return { body: cached.body, status: 200, contentType: cached.contentType };
    }

    // L2: R2
    const r2Object = await r2Get(githubUrl);
    if (r2Object != null) {
      const r2ContentType = r2Object.httpMetadata?.contentType ?? contentTypeForUrl(githubUrl);
      // small enough for L1 — buffer and cache
      if (r2Object.size <= MAX_MEM_CACHE_BODY_SIZE) {
        const buffer = await r2Object.arrayBuffer();
        memoryCache.set(githubUrl, { body: buffer, contentType: r2ContentType });
        return { body: buffer, status: 200, contentType: r2ContentType };
      }
      // large — stream directly without buffering
      return { body: r2Object.body, status: 200, contentType: r2ContentType };
    }

    // L3: fetch from GitHub
    const response = await fetchWithRetries(githubUrl);
    if (!response.ok) {
      if (response.status !== 404) {
        console.error(`GitHub fetch error: ${response.status} ${response.statusText} for ${githubUrl}`);
      }
      return {
        body: response.body,
        status: response.status,
        contentType: response.headers.get("content-type") ?? contentTypes.plain,
      };
    }

    const responseContentType = response.headers.get("content-type") ?? contentTypeForUrl(githubUrl);
    const body = await response.arrayBuffer();

    // populate caches
    const r2Promise = r2Put(githubUrl, body, responseContentType);
    if (ctx != null) {
      ctx.waitUntil(r2Promise);
    } else {
      await r2Promise;
    }
    if (body.byteLength <= MAX_MEM_CACHE_BODY_SIZE) {
      memoryCache.set(githubUrl, { body, contentType: responseContentType });
    }

    return { body, status: 200, contentType: responseContentType };
  }
}

export async function resolvePluginOrSchemaUrl(url: URL) {
  return (oldMappings as { [oldUrl: string]: string })[url.toString()]
    ?? await tryResolvePluginUrl(url)
    ?? await tryResolveSchemaUrl(url);
}

function getAccessControlAllowOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin != null && isLocalHostname(new URL(origin).hostname)
    ? origin
    : "https://dprint.dev";
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function createJsonResponse(text: string, request: Request) {
  return new Response(text, {
    headers: {
      "content-type": contentTypes.json,
      "Access-Control-Allow-Origin": getAccessControlAllowOrigin(request),
    },
    status: 200,
  });
}

function contentTypeForUrl(url: string) {
  if (url.endsWith(".wasm")) return contentTypes.wasm;
  if (url.endsWith(".json") || url.endsWith(".exe-plugin")) return contentTypes.json;
  return contentTypes.octetStream;
}

async function fetchWithRetries(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const response = await fetch(url, {
      headers: { "user-agent": "dprint-plugins" },
    });
    if (response.status < 500 || i === retries) {
      return response;
    }
    console.error(`GitHub fetch attempt ${i + 1} failed: ${response.status} for ${url}`);
    await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** i, 2500)));
  }
  throw new Error("unreachable");
}

function create404Response() {
  return new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
}
