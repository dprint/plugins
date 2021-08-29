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
    return createRedirectResponse(pluginUrl);
  }

  // match route starting with /downloads/plugin-x.x.x.wasm which will serve the response from this server
  if (url.pathname.startsWith("/download/") && url.pathname.endsWith(".wasm")) {
    return resolveRedirectDownloadResponse(request);
  }

  if (url.pathname.startsWith("/info.json")) {
    return fetch(new URL("info.json", import.meta.url));
  }

  if (url.pathname.startsWith("/schemas/json-v0.json")) {
    return fetch(new URL("schemas/json-v0.json", import.meta.url));
  }

  if (url.pathname.startsWith("/schemas/markdown-v0.json")) {
    return fetch(new URL("schemas/markdown-v0.json", import.meta.url));
  }

  if (url.pathname.startsWith("/schemas/typescript-v0.json")) {
    return schemaRedirect(
      request,
      "https://github.com/dprint/dprint-plugin-typescript/releases/latest/download/schema.json",
    );
  }

  if (url.pathname.startsWith("/schemas/toml-v0.json")) {
    return fetch(new URL("schemas/toml-v0.json", import.meta.url));
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

  return new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
}

// needed this to get the playground working due to CORs on GitHub
function resolveRedirectDownloadResponse(originalRequest: Request) {
  const requestUrl = new URL(originalRequest.url.replace(/\/download\//, "/"));
  const pluginUrl = tryResolvePluginUrl(requestUrl);
  return pluginUrl == null ? create404Response() : createWasmDownloadRedirectResponse(pluginUrl);

  function createWasmDownloadRedirectResponse(location: string) {
    return fetch(location)
      .then(response => {
        if (response.status !== 200) {
          return response;
        }

        return new Response(response.body, {
          headers: {
            "content-type": "application/wasm",
            // allow the playground to download this
            "Access-Control-Allow-Origin": getAccessControlAllowOrigin(originalRequest),
          },
          status: 200,
        });
      });
  }
}

// needed this to get the playground working due to CORs on GitHub
function schemaRedirect(originalRequest: Request, url: string) {
  return fetch(url)
    .then(response => {
      if (response.status !== 200) {
        return response;
      }

      return new Response(response.body, {
        headers: {
          "content-type": "application/json",
          // allow the playground to download this
          "Access-Control-Allow-Origin": getAccessControlAllowOrigin(originalRequest),
        },
        status: 200,
      });
    });
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

function getAccessControlAllowOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin != null && new URL(origin).hostname === "localhost" ? origin : "https://dprint.dev";
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
