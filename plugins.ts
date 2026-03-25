import { checkGithubRepoExists, getLatestReleaseInfo } from "./utils/mod.js";

const tagPattern = "([A-Za-z0-9\._]+)";
// repos may only contain alphanumeric, underscores, hyphens, and period
const repoNamePattern = "([A-Za-z0-9\-\._]+)";
const dprintWasmPluginPattern = new URLPattern({
  pathname: `/${repoNamePattern}-${tagPattern}.wasm`,
});
const dprintProcessPluginPattern = new URLPattern({
  pathname: `/${repoNamePattern}-${tagPattern}.json`,
});
// usernames may only contain alphanumeric and hypens
const usernamePattern = `([A-Za-z0-9\-]+)`;
const userRepoPattern = `${usernamePattern}/${repoNamePattern}`;
const userWasmPluginPattern = new URLPattern({
  pathname: `/${userRepoPattern}-${tagPattern}.wasm`,
});
const userProcessPluginPattern = new URLPattern({
  pathname: `/${userRepoPattern}-${tagPattern}.json`,
});
const userSchemaPattern = new URLPattern({
  pathname: `/${userRepoPattern}/${tagPattern}/schema.json`,
});

// known repos where shortname resolves to dprint-plugin-<name>,
// avoiding a GitHub API call to check existence
const KNOWN_DPRINT_PLUGIN_REPOS = new Set([
  // dprint org
  "dprint/dprint-plugin-typescript",
  "dprint/dprint-plugin-json",
  "dprint/dprint-plugin-markdown",
  "dprint/dprint-plugin-toml",
  "dprint/dprint-plugin-dockerfile",
  "dprint/dprint-plugin-biome",
  "dprint/dprint-plugin-oxc",
  "dprint/dprint-plugin-mago",
  "dprint/dprint-plugin-ruff",
  "dprint/dprint-plugin-jupyter",
  "dprint/dprint-plugin-prettier",
  "dprint/dprint-plugin-roslyn",
  "dprint/dprint-plugin-rustfmt",
  "dprint/dprint-plugin-yapf",
  "dprint/dprint-plugin-exec",
  "dprint/dprint-plugin-sql",
  // community
  "jakebailey/dprint-plugin-gofumpt",
  "malobre/dprint-plugin-vue",
]);

// repos where the short name IS the repo name (no dprint-plugin- prefix)
const KNOWN_NON_PREFIXED_REPOS = new Set([
  "g-plane/malva",
  "g-plane/markup_fmt",
  "g-plane/pretty_yaml",
  "g-plane/pretty_graphql",
  "lucacasonato/mf2-tools",
]);

export function isAssetAllowedRepo(username: string, _repo: string) {
  switch (username) {
    case "dprint":
      return true;
    default:
      return false;
  }
}

const assetNamePattern = "([A-Za-z0-9\\-\\._]+)";
const assetPattern = new URLPattern({
  pathname: `/${userRepoPattern}/${tagPattern}/asset/${assetNamePattern}`,
});

export function tryResolveAssetUrl(url: URL): { githubUrl: string; shouldCache: boolean } | undefined {
  const result = assetPattern.exec(url);
  if (!result) {
    return undefined;
  }
  const username = result.pathname.groups[0]!;
  const repo = result.pathname.groups[1]!;
  const tag = result.pathname.groups[2]!;
  const assetName = result.pathname.groups[3]!;
  const githubUrl = `https://github.com/${username}/${repo}/releases/download/${tag}/${assetName}`;
  const shouldCache = isAssetAllowedRepo(username, repo);
  return { githubUrl, shouldCache };
}

export async function tryResolvePluginUrl(url: URL) {
  return dprintPluginTagPatternMapper(dprintWasmPluginPattern, url, "plugin.wasm")
    ?? dprintPluginTagPatternMapper(dprintProcessPluginPattern, url, "plugin.json")
    ?? (await userRepoTagPatternMapper(userWasmPluginPattern, url, "plugin.wasm"))
    ?? (await userRepoTagPatternMapper(userProcessPluginPattern, url, "plugin.json"));
}

export function tryResolveSchemaUrl(url: URL) {
  return userRepoTagPatternMapper(userSchemaPattern, url, "schema.json");
}

const userLatestPattern = new URLPattern({
  pathname: `/${userRepoPattern}/latest.json`,
});
export async function tryResolveLatestJson(url: URL) {
  const result = userLatestPattern.exec(url);
  if (!result) {
    return undefined;
  }
  const username = result.pathname.groups[0]!;
  const shortRepoName = result.pathname.groups[1]!;
  const latestInfo = await getLatestInfo(username, shortRepoName, url.origin);
  if (latestInfo == null) {
    return 404;
  }

  // include the bare minimum in case someone else wants to implement
  // this behaviour on their server
  return {
    schemaVersion: 1,
    url: latestInfo.url,
    version: latestInfo.version,
    checksum: latestInfo.checksum,
  };
}

export async function getLatestInfo(username: string, repoName: string, origin: string) {
  repoName = await getFullRepoName(username, repoName);
  const releaseInfo = await getLatestReleaseInfo(username, repoName);
  if (releaseInfo == null) {
    return undefined;
  }
  const displayRepoName = repoName.replace(/^dprint-plugin-/, "");
  const extension = releaseInfo.kind === "wasm" ? "wasm" : "json";

  // include the bare minimum in case someone else wants to implement
  // this behaviour on their server
  return {
    schemaVersion: 1,
    url: username === "dprint"
      ? `${origin}/${displayRepoName}-${releaseInfo.tagName}.${extension}`
      : `${origin}/${username}/${displayRepoName}-${releaseInfo.tagName}.${extension}`,
    version: releaseInfo.tagName.replace(/^v/, ""),
    checksum: releaseInfo.checksum,
    downloadCount: releaseInfo.downloadCount,
  };
}

function dprintPluginTagPatternMapper(
  pattern: URLPattern,
  url: URL,
  fileName: string,
) {
  const result = pattern.exec(url);
  if (result) {
    const pluginShortName = result.pathname.groups[0];
    const tag = result.pathname.groups[1];
    if (tag === "latest") {
      return `https://github.com/dprint/dprint-plugin-${pluginShortName}/releases/latest/download/${fileName}`;
    } else {
      return `https://github.com/dprint/dprint-plugin-${pluginShortName}/releases/download/${tag}/${fileName}`;
    }
  }
  return undefined;
}

async function userRepoTagPatternMapper(
  pattern: URLPattern,
  url: URL,
  fileName: string,
) {
  const result = pattern.exec(url);
  if (result) {
    const username = result.pathname.groups[0]!;
    const repo = await getFullRepoName(username, result.pathname.groups[1]!);
    if (username === "lucacasonato" && repo === "mf2-tools") {
      switch (fileName) {
        case "plugin.wasm":
          fileName = "dprint-plugin-mf2.wasm";
          break;
        case "schema.json":
          fileName = "dprint-plugin-mf2.schema.json";
          break;
      }
    }
    const tag = result.pathname.groups[2];
    if (tag === "latest") {
      return `https://github.com/${username}/${repo}/releases/latest/download/${fileName}`;
    } else {
      return `https://github.com/${username}/${repo}/releases/download/${tag}/${fileName}`;
    }
  }
  return undefined;
}

async function getFullRepoName(username: string, repoName: string) {
  if (repoName.startsWith("dprint-plugin-")) {
    return repoName;
  }
  const fullName = `dprint-plugin-${repoName}`;
  if (KNOWN_NON_PREFIXED_REPOS.has(`${username}/${repoName}`)) {
    return repoName;
  }
  if (KNOWN_DPRINT_PLUGIN_REPOS.has(`${username}/${fullName}`)) {
    return fullName;
  }
  if (await checkGithubRepoExists(username, fullName)) {
    return fullName;
  } else {
    return repoName;
  }
}
