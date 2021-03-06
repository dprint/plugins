/// <reference path="./deploy.d.ts" />
import { pluginResolvers } from "./plugins.ts";

addEventListener("fetch", event => {
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
        return resolveRedirectDownloadResponse(new URL(request.url.replace(/\/download\//, "/")));
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
        return fetch(new URL("schemas/typescript-v0.json", import.meta.url));
    }

    if (url.pathname === "/") {
        return fetch(new URL("index.html", import.meta.url))
            .then(response => response.text())
            .then(body =>
                new Response(body, {
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
function resolveRedirectDownloadResponse(requestUrl: URL) {
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
                        "Access-Control-Allow-Origin": "https://dprint.dev",
                    },
                    status: 200,
                });
            });
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

function createRedirectResponse(location: string) {
    return new Response(null, {
        headers: {
            location,
        },
        status: 302,
    });
}

function create404Response() {
    return new Response(null, {
        status: 404,
        statusText: "Not Found",
    });
}
