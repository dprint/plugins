/// <reference path="./deploy.d.ts" />
import { parseVersion } from "./version.ts";

interface PluginResolver {
    tryGetVersion(url: URL): string | undefined;
    getRedirectUrl(version: string): string;
}

const pluginResolvers: PluginResolver[] = [{
    tryGetVersion(url) {
        return /^\/typescript-([0-9]+\.[0-9]+\.[0-9]+).wasm$/.exec(url.pathname)?.[1];
    },
    getRedirectUrl(version) {
        if (parseVersion(version).lessThanEqual(parseVersion("0.44.0"))) {
            return `https://github.com/dprint/dprint-plugin-typescript/releases/download/${version}/typescript-${version}.wasm`;
        } else {
            return `https://github.com/dprint/dprint-plugin-typescript/releases/download/${version}/typescript.wasm`;
        }
    },
}, {
    tryGetVersion(url) {
        return /^\/json-([0-9]+\.[0-9]+\.[0-9]+).wasm$/.exec(url.pathname)?.[1];
    },
    getRedirectUrl(version) {
        if (parseVersion(version).lessThanEqual(parseVersion("0.10.1"))) {
            return `https://github.com/dprint/dprint-plugin-json/releases/download/${version}/json-${version}.wasm`;
        } else {
            return `https://github.com/dprint/dprint-plugin-json/releases/download/${version}/json.wasm`;
        }
    },
}, {
    tryGetVersion(url) {
        return /^\/markdown-([0-9]+\.[0-9]+\.[0-9]+).wasm$/.exec(url.pathname)?.[1];
    },
    getRedirectUrl(version) {
        if (parseVersion(version).lessThanEqual(parseVersion("0.7.0"))) {
            return `https://github.com/dprint/dprint-plugin-markdown/releases/download/${version}/markdown-${version}.wasm`;
        } else {
            return `https://github.com/dprint/dprint-plugin-markdown/releases/download/${version}/markdown.wasm`;
        }
    },
}, {
    tryGetVersion(url) {
        return /^\/rustfmt-([0-9]+\.[0-9]+\.[0-9]+).wasm$/.exec(url.pathname)?.[1];
    },
    getRedirectUrl(version) {
        if (parseVersion(version).lessThanEqual(parseVersion("0.3.0"))) {
            return `https://github.com/dprint/dprint-plugin-rustfmt/releases/download/${version}/rustfmt-${version}.wasm`;
        } else {
            return `https://github.com/dprint/dprint-plugin-rustfmt/releases/download/${version}/rustfmt.wasm`;
        }
    },
}, {
    tryGetVersion(url) {
        return /^\/prettier-([0-9]+\.[0-9]+\.[0-9]+).exe-plugin$/.exec(url.pathname)?.[1];
    },
    getRedirectUrl(version) {
        return `https://github.com/dprint/dprint-plugin-prettier/releases/download/${version}/prettier.exe-plugin`;
    },
}, {
    tryGetVersion(url) {
        return /^\/roslyn-([0-9]+\.[0-9]+\.[0-9]+).exe-plugin$/.exec(url.pathname)?.[1];
    },
    getRedirectUrl(version) {
        return `https://github.com/dprint/dprint-plugin-roslyn/releases/download/${version}/roslyn.exe-plugin`;
    },
}, {
    tryGetVersion(url) {
        return /^\/yapf-([0-9]+\.[0-9]+\.[0-9]+).exe-plugin$/.exec(url.pathname)?.[1];
    },
    getRedirectUrl(version) {
        return `https://github.com/dprint/dprint-plugin-yapf/releases/download/${version}/yapf.exe-plugin`;
    },
}];

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
        return createRedirectResponse("https://github.com/dprint/plugins/");
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
