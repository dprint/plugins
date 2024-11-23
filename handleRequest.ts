import { renderHome } from "./home.tsx";
import oldMappings from "./old_redirects.json" with { type: "json" };
import { tryResolveLatestJson, tryResolvePluginUrl, tryResolveSchemaUrl } from "./plugins.ts";
import { readInfoFile } from "./readInfoFile.ts";
import { Clock } from "./utils/clock.ts";
import { createFetchCacher, getCliInfo } from "./utils/mod.ts";

const contentTypes = {
  css: "text/css; charset=utf-8",
  html: "text/html; charset=utf-8",
  json: "application/json; charset=utf-8",
  plain: "text/plain; charset=utf-8",
  wasm: "application/wasm",
};

export function createRequestHandler(clock: Clock) {
  const { fetchCached } = createFetchCacher(clock);
  return {
    async handleRequest(request: Request, info: Deno.ServeHandlerInfo<Deno.NetAddr>) {
      const url = new URL(request.url);
      const newUrl = await resolvePluginOrSchemaUrl(url);
      if (newUrl != null) {
        const contentType = newUrl.endsWith(".json")
          ? contentTypes.json
          : newUrl.endsWith(".wasm")
          ? contentTypes.wasm
          : contentTypes.plain;
        return handleConditionalRedirectRequest({
          request,
          url: newUrl,
          contentType,
          hostname: info.remoteAddr.hostname,
        });
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
        return Deno.readTextFile("./style.css").then((text) =>
          new Response(text, {
            headers: {
              "content-type": "text/css; charset=utf-8",
            },
            status: 200,
          })
        );
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

  // This is done to allow the playground to access these files
  function handleConditionalRedirectRequest(params: {
    request: Request;
    url: string;
    contentType: string;
    hostname: string;
  }) {
    if (shouldDirectlyServeFile(params.request)) {
      return fetchCached(params)
        .then((result) => {
          if (result.kind === "error") {
            return result.response;
          }

          return new Response(result.body, {
            headers: {
              "content-type": params.contentType,
              // allow the playground to download this
              "Access-Control-Allow-Origin": getAccessControlAllowOrigin(
                params.request,
              ),
            },
            status: 200,
          });
        }).catch((err) => {
          console.error(err);
          return new Response("Internal Server Error", {
            status: 500,
          });
        });
    } else {
      return createRedirectResponse(params.url);
    }
  }
}

async function resolvePluginOrSchemaUrl(url: URL) {
  return (oldMappings as { [oldUrl: string]: string })[url.toString()]
    ?? await tryResolvePluginUrl(url)
    ?? await tryResolveSchemaUrl(url);
}

function getAccessControlAllowOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin != null && new URL(origin).hostname === "localhost"
    ? origin
    : "https://dprint.dev";
}

function shouldDirectlyServeFile(request: Request) {
  // directly serve for when Deno makes a request in order to fix the content type
  if (request.headers.get("user-agent")?.startsWith("Deno/")) {
    return true;
  }

  const origin = request.headers.get("origin");
  if (origin == null) {
    return false;
  }

  const hostname = new URL(origin).hostname;
  return hostname === "localhost" || hostname === "dprint.dev";
}

function createRedirectResponse(location: string) {
  return new Response(null, {
    headers: {
      location,
    },
    status: 302, // temporary redirect
  });
}

function createJsonResponse(text: string, request: Request) {
  return new Response(text, {
    headers: {
      "content-type": contentTypes.json,
      // allow the dprint website to download this file
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
