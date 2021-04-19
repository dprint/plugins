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

    if (url.pathname === "/") {
        return fetch(new URL("index.html", import.meta.url));
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
        },
        status: 302,
    });
}
