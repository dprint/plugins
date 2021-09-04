import { renderHome } from "./home.tsx";
import { pluginResolvers } from "./plugins.ts";

addEventListener("fetch", event => {
  // @ts-ignore: temp ignore
  event.respondWith(handleRequest(event.request));
});

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
      contentType: "application/json",
    });
  }

  if (url.pathname.startsWith("/info.json")) {
    return Deno.readTextFile("./info.json").then(text =>
      new Response(text, {
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
        status: 200,
      })
    );
  }

  if (url.pathname.startsWith("/schemas/json-v0.json")) {
    return handleConditionalRedirectRequest({
      request,
      url: "https://github.com/dprint/dprint-plugin-json/releases/latest/download/schema.json",
      contentType: "application/json",
    });
  }

  if (url.pathname.startsWith("/schemas/markdown-v0.json")) {
    return handleConditionalRedirectRequest({
      request,
      url: "https://github.com/dprint/dprint-plugin-markdown/releases/latest/download/schema.json",
      contentType: "application/json",
    });
  }

  if (url.pathname.startsWith("/schemas/typescript-v0.json")) {
    return handleConditionalRedirectRequest({
      request,
      url: "https://github.com/dprint/dprint-plugin-typescript/releases/latest/download/schema.json",
      contentType: "application/json",
    });
  }

  if (url.pathname.startsWith("/schemas/toml-v0.json")) {
    return handleConditionalRedirectRequest({
      request,
      url: "https://github.com/dprint/dprint-plugin-toml/releases/latest/download/schema.json",
      contentType: "application/json",
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
    );
  }

  return create404Response();
}

// This is done to allow the playground to access these files
function handleConditionalRedirectRequest(params: { request: Request; url: string; contentType: string }) {
  if (shouldDirectlyServeFile(params.request)) {
    return fetch(params.url)
      .then(response => {
        if (response.status !== 200) {
          return response;
        }

        return new Response(response.body, {
          headers: {
            "content-type": params.contentType,
            // allow the playground to download this
            "Access-Control-Allow-Origin": getAccessControlAllowOrigin(params.request),
          },
          status: 200,
        });
      });
  } else {
    return createRedirectResponse(params.url);
  }
}

function tryResolvePluginUrl(url: URL) {
  for (const plugin of pluginResolvers) {
    const version = plugin.tryGetVersion(url);
    if (version != null) {
      return plugin.getRedirectUrl(version);
    }
  }
  return undefined;
}

function tryResolveSchemaUrl(url: URL) {
  for (const plugin of pluginResolvers) {
    const version = plugin.tryGetVersionFromSchemaUrl?.(url);
    if (version != null) {
      return plugin.getSchemaUrl?.(version);
    }
  }
  return undefined;
}

function getAccessControlAllowOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin != null && new URL(origin).hostname === "localhost" ? origin : "https://dprint.dev";
}

function shouldDirectlyServeFile(request: Request) {
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
