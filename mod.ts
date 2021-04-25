/// <reference path="./deploy.d.ts" />
import { pluginResolvers } from "./plugins.ts";

addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request));
});

function handleRequest(request: Request) {
    const url = new URL(request.url);

    for (const plugin of pluginResolvers) {
        const version = plugin.tryGetVersion(url);
        if (version != null) {
            return createRedirectResponse(plugin.getRedirectUrl(version));
        }
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

function createRedirectResponse(location: string) {
    return new Response(null, {
        headers: {
            location,
            "Access-Control-Allow-Origin": "*",
            "Referrer-Policy": "no-referrer",
        },
        status: 302,
    });
}
