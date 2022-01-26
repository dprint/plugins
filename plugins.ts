import { parseVersion } from "./version.ts";

export interface PluginResolver {
  versionPattern: URLPattern;
  getRedirectUrl(version: string): string;
  schemaVersionUrlPattern?: URLPattern;
  getSchemaUrl?(version: string): string;
}

export const pluginResolvers: PluginResolver[] = [{
  versionPattern: new URLPattern({ pathname: "/typescript-([0-9]+\.[0-9]+\.[0-9]+).wasm" }),
  getRedirectUrl(version) {
    if (parseVersion(version).lessThanEqual(parseVersion("0.44.0"))) {
      return `https://github.com/dprint/dprint-plugin-typescript/releases/download/${version}/typescript-${version}.wasm`;
    } else {
      return `https://github.com/dprint/dprint-plugin-typescript/releases/download/${version}/typescript.wasm`;
    }
  },
  schemaVersionUrlPattern: new URLPattern({ pathname: "/schemas/typescript-([0-9]+\.[0-9]+\.[0-9]+).json" }),
  getSchemaUrl(version) {
    return `https://github.com/dprint/dprint-plugin-typescript/releases/download/${version}/schema.json`;
  },
}, {
  versionPattern: new URLPattern({ pathname: "/json-([0-9]+\.[0-9]+\.[0-9]+).wasm" }),
  getRedirectUrl(version) {
    if (parseVersion(version).lessThanEqual(parseVersion("0.10.1"))) {
      return `https://github.com/dprint/dprint-plugin-json/releases/download/${version}/json-${version}.wasm`;
    } else {
      return `https://github.com/dprint/dprint-plugin-json/releases/download/${version}/json.wasm`;
    }
  },
  schemaVersionUrlPattern: new URLPattern({ pathname: "/schemas/json-([0-9]+\.[0-9]+\.[0-9]+).json" }),
  getSchemaUrl(version) {
    return `https://github.com/dprint/dprint-plugin-json/releases/download/${version}/schema.json`;
  },
}, {
  versionPattern: new URLPattern({ pathname: "/markdown-([0-9]+\.[0-9]+\.[0-9]+).wasm" }),
  getRedirectUrl(version) {
    if (parseVersion(version).lessThanEqual(parseVersion("0.7.0"))) {
      return `https://github.com/dprint/dprint-plugin-markdown/releases/download/${version}/markdown-${version}.wasm`;
    } else {
      return `https://github.com/dprint/dprint-plugin-markdown/releases/download/${version}/markdown.wasm`;
    }
  },
  schemaVersionUrlPattern: new URLPattern({ pathname: "/schemas/markdown-([0-9]+\.[0-9]+\.[0-9]+).json" }),
  getSchemaUrl(version) {
    return `https://github.com/dprint/dprint-plugin-markdown/releases/download/${version}/schema.json`;
  },
}, {
  versionPattern: new URLPattern({ pathname: "/toml-([0-9]+\.[0-9]+\.[0-9]+).wasm" }),
  getRedirectUrl(version) {
    return `https://github.com/dprint/dprint-plugin-toml/releases/download/${version}/toml.wasm`;
  },
  schemaVersionUrlPattern: new URLPattern({ pathname: "/schemas/toml-([0-9]+\.[0-9]+\.[0-9]+).json" }),
  getSchemaUrl(version) {
    return `https://github.com/dprint/dprint-plugin-toml/releases/download/${version}/schema.json`;
  },
}, {
  versionPattern: new URLPattern({ pathname: "/dockerfile-([0-9]+\.[0-9]+\.[0-9]+).wasm" }),
  getRedirectUrl(version) {
    return `https://github.com/dprint/dprint-plugin-dockerfile/releases/download/${version}/dockerfile.wasm`;
  },
  schemaVersionUrlPattern: new URLPattern({ pathname: "/schemas/dockerfile-([0-9]+\.[0-9]+\.[0-9]+).json" }),
  getSchemaUrl(version) {
    return `https://github.com/dprint/dprint-plugin-dockerfile/releases/download/${version}/schema.json`;
  },
}, {
  versionPattern: new URLPattern({ pathname: "/sql-([0-9]+\.[0-9]+\.[0-9]+).wasm" }),
  getRedirectUrl(version) {
    return `https://github.com/dprint/dprint-plugin-sql/releases/download/${version}/sql.wasm`;
  },
  schemaVersionUrlPattern: new URLPattern({ pathname: "/schemas/sql-([0-9]+\.[0-9]+\.[0-9]+).json" }),
  getSchemaUrl(version) {
    return `https://github.com/dprint/dprint-plugin-sql/releases/download/${version}/schema.json`;
  },
}, {
  versionPattern: new URLPattern({ pathname: "/rustfmt-([0-9]+\.[0-9]+\.[0-9]+).wasm" }),
  getRedirectUrl(version) {
    if (parseVersion(version).lessThanEqual(parseVersion("0.3.0"))) {
      return `https://github.com/dprint/dprint-plugin-rustfmt/releases/download/${version}/rustfmt-${version}.wasm`;
    } else {
      return `https://github.com/dprint/dprint-plugin-rustfmt/releases/download/${version}/rustfmt.wasm`;
    }
  },
}, {
  versionPattern: new URLPattern({ pathname: "/rustfmt-([0-9]+\.[0-9]+\.[0-9]+).exe-plugin" }),
  getRedirectUrl(version) {
    return `https://github.com/dprint/dprint-plugin-rustfmt/releases/download/${version}/rustfmt.exe-plugin`;
  },
}, {
  versionPattern: new URLPattern({ pathname: "/prettier-([0-9]+\.[0-9]+\.[0-9]+).exe-plugin" }),
  getRedirectUrl(version) {
    return `https://github.com/dprint/dprint-plugin-prettier/releases/download/${version}/prettier.exe-plugin`;
  },
}, {
  versionPattern: new URLPattern({ pathname: "/roslyn-([0-9]+\.[0-9]+\.[0-9]+).exe-plugin" }),
  getRedirectUrl(version) {
    return `https://github.com/dprint/dprint-plugin-roslyn/releases/download/${version}/roslyn.exe-plugin`;
  },
}, {
  versionPattern: new URLPattern({ pathname: "/yapf-([0-9]+\.[0-9]+\.[0-9]+).exe-plugin" }),
  getRedirectUrl(version) {
    return `https://github.com/dprint/dprint-plugin-yapf/releases/download/${version}/yapf.exe-plugin`;
  },
}];

export function tryResolvePluginUrl(url: URL) {
  for (const plugin of pluginResolvers) {
    const version = plugin.versionPattern.exec(url)?.pathname.groups[0];
    if (version != null) {
      return plugin.getRedirectUrl(version);
    }
  }
  return undefined;
}

export function tryResolveSchemaUrl(url: URL) {
  for (const plugin of pluginResolvers) {
    const version = plugin.schemaVersionUrlPattern?.exec(url)?.pathname.groups[0];
    if (version != null) {
      return plugin.getSchemaUrl?.(version);
    }
  }
  return undefined;
}

export async function getPluginsInfoData() {
  return JSON.parse(await loadInfoFile()) as Readonly<PluginsData>;
}

async function loadInfoFile() {
  try {
    return await Deno.readTextFile("./info.json");
  } catch (err) {
    throw new Error("Could not load info.json", { cause: err });
  }
}

export interface PluginsData {
  latest: PluginData[];
}

export interface PluginData {
  name: string;
  url: string;
}
