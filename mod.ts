import { listenAndServe } from "https://deno.land/std@0.111.0/http/server.ts";
import { fetchCached } from "./cache.ts";
import { renderHome } from "./home.tsx";
import { tryResolvePluginUrl, tryResolveSchemaUrl } from "./plugins.ts";

await listenAndServe(":8080", (request) => handleRequest(request));

function handleRequest(request: Request) {
  const url = new URL(request.url);

  const pluginUrl = tryResolvePluginUrl(url);
  if (pluginUrl != null) {
    return handleConditionalRedirectRequest({
      request,
      url: pluginUrl,
      contentType: "application/wasm",
    });
  }

  const schemaUrl = tryResolveSchemaUrl(url);
  if (schemaUrl != null) {
    return handleConditionalRedirectRequest({
      request,
      url: schemaUrl,
      contentType: "application/json; charset=utf-8",
    });
  }

  if (url.pathname.startsWith("/info.json")) {
    return Deno.readTextFile("./info.json").then(text =>
      new Response(text, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          // allow the dprint website to download this file
          "Access-Control-Allow-Origin": getAccessControlAllowOrigin(request),
        },
        status: 200,
      })
    );
  }

  if (url.pathname.startsWith("/schemas/json-latest.json")) {
    return handleConditionalRedirectRequest({
      request,
      url: "https://github.com/dprint/dprint-plugin-json/releases/latest/download/schema.json",
      contentType: "application/json; charset=utf-8",
    });
  }

  if (url.pathname.startsWith("/schemas/markdown-latest.json")) {
    return handleConditionalRedirectRequest({
      request,
      url: "https://github.com/dprint/dprint-plugin-markdown/releases/latest/download/schema.json",
      contentType: "application/json; charset=utf-8",
    });
  }

  if (url.pathname.startsWith("/schemas/typescript-latest.json")) {
    return handleConditionalRedirectRequest({
      request,
      url: "https://github.com/dprint/dprint-plugin-typescript/releases/latest/download/schema.json",
      contentType: "application/json; charset=utf-8",
    });
  }

  if (url.pathname.startsWith("/schemas/toml-latest.json")) {
    return handleConditionalRedirectRequest({
      request,
      url: "https://github.com/dprint/dprint-plugin-toml/releases/latest/download/schema.json",
      contentType: "application/json; charset=utf-8",
    });
  }
  if (url.pathname.startsWith("/schemas/dockerfile-latest.json")) {
    return handleConditionalRedirectRequest({
      request,
      url: "https://github.com/dprint/dprint-plugin-dockerfile/releases/latest/download/schema.json",
      contentType: "application/json; charset=utf-8",
    });
  }

  if (url.pathname === "/style.css") {
    return Deno.readTextFile("./style.css").then(text =>
      new Response(text, {
        headers: {
          "content-type": "text/css; charset=utf-8",
        },
        status: 200,
      })
    );
  }

  if (url.pathname === "/") {
    return renderHome().then(home =>
      new Response(home, {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
        status: 200,
      })
    ).catch(err =>
      new Response(`Error: ${err.toString?.() ?? err}`, {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
        status: 500,
      })
    );
  }

  return create404Response();
}

// This is done to allow the playground to access these files
function handleConditionalRedirectRequest(params: { request: Request; url: string; contentType: string }) {
  if (shouldDirectlyServeFile(params.request)) {
    return fetchCached(params.url)
      .then(result => {
        if (result.kind === "error") {
          return result.response;
        }

        return new Response(result.body, {
          headers: {
            "content-type": params.contentType,
            // allow the playground to download this
            "Access-Control-Allow-Origin": getAccessControlAllowOrigin(params.request),
          },
          status: 200,
        });
      }).catch(err => {
        console.error(err);
        return new Response("Internal Server Error", {
          status: 500,
        });
      });
  } else {
    return createRedirectResponse(params.url);
  }
}

function getAccessControlAllowOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin != null && new URL(origin).hostname === "localhost" ? origin : "https://dprint.dev";
}

function shouldDirectlyServeFile(request: Request) {
  // directly serve for when Deno makes a request
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

function create404Response() {
  return new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
}
