import { parseVersion } from "./version.ts";

export interface PluginResolver {
  tryGetVersion(url: URL): string | undefined;
  getRedirectUrl(version: string): string;
}

export const pluginResolvers: PluginResolver[] = [{
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
    return /^\/toml-([0-9]+\.[0-9]+\.[0-9]+).wasm$/.exec(url.pathname)?.[1];
  },
  getRedirectUrl(version) {
    return `https://github.com/dprint/dprint-plugin-toml/releases/download/${version}/toml.wasm`;
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
    return /^\/rustfmt-([0-9]+\.[0-9]+\.[0-9]+).exe-plugin$/.exec(url.pathname)?.[1];
  },
  getRedirectUrl(version) {
    return `https://github.com/dprint/dprint-plugin-rustfmt/releases/download/${version}/rustfmt.exe-plugin`;
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

export async function getPluginsInfoData() {
  return JSON.parse(await Deno.readTextFile("./info.json")) as PluginsData;
}

export interface PluginsData {
  latest: PluginData[];
}

export interface PluginData {
  name: string;
  url: string;
}
