import { env } from "cloudflare:workers";
import { renderHome } from "./home.jsx";
import oldMappings from "./old_redirects.json" with { type: "json" };
import {
  type PluginUrlResult,
  tryResolveAssetUrl,
  tryResolveLatestJson,
  tryResolvePluginUrl,
  tryResolveSchemaUrl,
} from "./plugins.js";
import { readInfoFile } from "./readInfoFile.js";
import robotsTxt from "./robots.txt";
import styleCSS from "./style.css";
import { fetchWithRetries } from "./utils/fetchWithRetries.js";
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
      const assetResult = tryResolveAssetUrl(url);
      if (assetResult != null) {
        if (!assetResult.shouldCache) {
          return Response.redirect(assetResult.githubUrl, 302);
        }
        return servePlugin(request, assetResult.githubUrl, ctx);
      }

      const githubUrl = await resolvePluginOrSchemaUrl(url);
      if (githubUrl != null) {
        if (!githubUrl.endsWith(".wasm")) {
          // redirect non-wasm files to asset URL so relative URLs in
          // plugin.json files resolve correctly
          const assetPath = githubUrlToAssetPath(githubUrl);
          if (assetPath != null) {
            return Response.redirect(`${url.origin}${assetPath}`, 302);
          }
        }
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
        const infoFileData = await readInfoFile(url.origin);
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
        return renderHome(url.origin).then((home) =>
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
    const result = await resolveBodyWithMemoryCache(githubUrl, ctx);
    return new Response(result.body, {
      headers: {
        "content-type": result.contentType,
        "Access-Control-Allow-Origin": getAccessControlAllowOrigin(request),
      },
      status: result.status,
    });
  }

  async function resolveBodyWithMemoryCache(
    githubUrl: string,
    ctx?: ExecutionContext,
  ): Promise<{ body: ArrayBuffer | ReadableStream | null; status: number; contentType: string }> {
    // L1: in-memory cache
    const cached = memoryCache.get(githubUrl);
    if (cached != null) {
      return { body: cached.body, status: 200, contentType: cached.contentType };
    }

    const result = await fetchBody(githubUrl, ctx);
    if (
      result.status === 200 && result.body instanceof ArrayBuffer && result.body.byteLength <= MAX_MEM_CACHE_BODY_SIZE
    ) {
      memoryCache.set(githubUrl, { body: result.body, contentType: result.contentType });
    }

    return result;
  }

  async function fetchBody(
    githubUrl: string,
    ctx?: ExecutionContext,
  ): Promise<{ body: ArrayBuffer | ReadableStream | null; status: number; contentType: string }> {
    // L2: R2 (stores original content)
    const r2Object = await r2Get(githubUrl);
    if (r2Object != null) {
      const contentType = r2Object.httpMetadata?.contentType ?? contentTypeForUrl(githubUrl);
      if (r2Object.size <= MAX_MEM_CACHE_BODY_SIZE) {
        return { body: await r2Object.arrayBuffer(), status: 200, contentType };
      }
      // large — stream directly without buffering
      return { body: r2Object.body, status: 200, contentType };
    }

    // L3: fetch from GitHub
    const response = await fetchWithRetries(githubUrl, {
      // don't need the github token here because these assets
      // are not part of the github api
      headers: { "user-agent": "dprint-plugins" },
    });
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

    const contentType = response.headers.get("content-type") ?? contentTypeForUrl(githubUrl);
    const body = await response.arrayBuffer();

    // store original in R2
    const r2Promise = r2Put(githubUrl, body, contentType);
    if (ctx != null) {
      ctx.waitUntil(r2Promise);
    } else {
      await r2Promise;
    }

    return { body, status: 200, contentType };
  }
}

export async function resolvePluginOrSchemaUrl(url: URL) {
  const oldMapping = (oldMappings as { [oldUrl: string]: string })[url.toString()];
  if (oldMapping != null) {
    return oldMapping;
  }
  const pluginResult = await tryResolvePluginUrl(url);
  if (pluginResult != null) {
    trackPluginDownload(pluginResult);
    return pluginResult.githubUrl;
  }
  return await tryResolveSchemaUrl(url);
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

// converts a GitHub release URL to a local asset path
// e.g. https://github.com/dprint/dprint-plugin-prettier/releases/download/0.7.0/plugin.json
//   -> /dprint/dprint-plugin-prettier/0.7.0/asset/plugin.json
const githubReleasePattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.+)$/;
function githubUrlToAssetPath(githubUrl: string) {
  const match = githubReleasePattern.exec(githubUrl);
  if (match == null) {
    return undefined;
  }
  const [, username, repo, tag, fileName] = match;
  return `/${username}/${repo}/${tag}/asset/${fileName}`;
}

function contentTypeForUrl(url: string) {
  if (url.endsWith(".wasm")) return contentTypes.wasm;
  if (url.endsWith(".json") || url.endsWith(".exe-plugin")) return contentTypes.json;
  return contentTypes.octetStream;
}

function trackPluginDownload(result: PluginUrlResult) {
  try {
    env.DPRINT_PLUGIN_DOWNLOAD_ANALYTICS.writeDataPoint({
      indexes: [`${result.username}/${result.repo}`],
      blobs: [result.tag],
      doubles: [1],
    });
  } catch (err) {
    console.warn("Failed to write analytics:", err);
  }
}

function create404Response() {
  return new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
}
