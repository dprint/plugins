import { renderHome } from "./home.jsx";
import oldMappings from "./old_redirects.json" with { type: "json" };
import { tryResolveLatestJson, tryResolvePluginUrl, tryResolveSchemaUrl } from "./plugins.js";
import { readInfoFile } from "./readInfoFile.js";
import styleCSS from "./style.css";
import { LruCache } from "./utils/LruCache.js";
import { getCliInfo } from "./utils/mod.js";
import { r2Get, r2Put } from "./utils/r2Cache.js";

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

const contentTypes = {
  css: "text/css; charset=utf-8",
  html: "text/html; charset=utf-8",
  json: "application/json; charset=utf-8",
  plain: "text/plain; charset=utf-8",
  wasm: "application/wasm",
};

export function createRequestHandler() {
  const memoryCache = new LruCache<string, ArrayBuffer>({ size: 50 });
  return {
    async handleRequest(request: Request, ctx?: ExecutionContext) {
      const url = new URL(request.url);
      const githubUrl = await resolvePluginOrSchemaUrl(url);
      if (githubUrl != null) {
        const contentType = githubUrl.endsWith(".json") || githubUrl.endsWith(".exe-plugin")
          ? contentTypes.json
          : githubUrl.endsWith(".wasm")
          ? contentTypes.wasm
          : contentTypes.plain;
        return servePlugin(request, githubUrl, contentType, ctx);
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

  async function servePlugin(request: Request, githubUrl: string, contentType: string, ctx?: ExecutionContext) {
    try {
      const body = await resolveBody(githubUrl, contentType, ctx);
      return new Response(body, {
        headers: {
          "content-type": contentType,
          "Access-Control-Allow-Origin": getAccessControlAllowOrigin(request),
        },
        status: 200,
      });
    } catch (err) {
      console.error("Error serving plugin:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  async function resolveBody(githubUrl: string, contentType: string, ctx?: ExecutionContext): Promise<ArrayBuffer> {
    // L1: in-memory cache
    const cached = memoryCache.get(githubUrl);
    if (cached != null) {
      return cached;
    }

    // L2: R2
    const r2Body = await r2Get(githubUrl);
    if (r2Body != null) {
      if (r2Body.byteLength <= MAX_BODY_SIZE) {
        memoryCache.set(githubUrl, r2Body);
      }
      return r2Body;
    }

    // L3: fetch from GitHub
    const response = await fetch(githubUrl, {
      headers: { "user-agent": "dprint-plugins" },
    });
    if (!response.ok) {
      throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
    }

    const body = await response.arrayBuffer();

    // populate caches
    const r2Promise = r2Put(githubUrl, body, contentType);
    if (ctx != null) {
      ctx.waitUntil(r2Promise);
    } else {
      await r2Promise;
    }
    if (body.byteLength <= MAX_BODY_SIZE) {
      memoryCache.set(githubUrl, body);
    }

    return body;
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

function create404Response() {
  return new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
}
