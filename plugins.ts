import infoJson from "./info.json" with { type: "json" };
import { checkGithubRepoExists, getLatestReleaseInfo, type ReleaseInfo } from "./utils/mod.js";

const tagPattern = "([A-Za-z0-9\._]+)";
const releaseTagPattern = "([A-Za-z0-9\-\._]+)";
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
  pathname: `/${userRepoPattern}/${releaseTagPattern}/schema.json`,
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
  "drluckyspin/dprint-plugin-swift",
  "apcamargo/dprint-plugin-typstyle",
  "jolars/dprint-plugin-panache",
]);

// repos where the short name IS the repo name (no dprint-plugin- prefix)
const KNOWN_NON_PREFIXED_REPOS = new Set([
  "g-plane/malva",
  "g-plane/markup_fmt",
  "g-plane/pretty_yaml",
  "g-plane/pretty_graphql",
  "lucacasonato/mf2-tools",
  "bartlomieju/lax-css",
  "bartlomieju/lax-markup",
  "bartlomieju/lax-sql",
  "sargunv/dprint-clang-format",
  "sargunv/dprint-cmakefmt",
  "kjanat/PSScriptAnalyzer",
]);

/** The npm package a plugin is distributed as. */
export interface PluginNpmInfo {
  name: string;
  // where the plugin sits within the package, for one that doesn't ship it at
  // the root. defaults to plugin.wasm / plugin.json by plugin kind.
  path?: string;
}

// the npm packages declared in info.json, keyed by `username/repo`. both the
// prefixed and unprefixed repo names are registered because either may be the
// resolved repo name (ex. `dprint/dprint-plugin-typescript` and `g-plane/malva`)
const npmPackagesByRepo = buildNpmPackagesByRepo();

const RELEASE_TAG_SUFFIXES = new Map([
  ["kjanat/PSScriptAnalyzer", "-dprint"],
]);

const APPROVED_ASSET_REPOS = new Set([
  "drluckyspin/dprint-plugin-swift",
  "kjanat/PSScriptAnalyzer",
]);

export function isAssetAllowedRepo(username: string, repo: string) {
  if (username === "dprint") {
    return true;
  }
  return APPROVED_ASSET_REPOS.has(`${username}/${repo}`);
}

const assetNamePattern = "([A-Za-z0-9\\-\\._]+)";
const assetPattern = new URLPattern({
  pathname: `/${userRepoPattern}/${releaseTagPattern}/asset/${assetNamePattern}`,
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

export interface PluginUrlResult {
  githubUrl: string;
  username: string;
  repo: string;
  tag: string;
}

export async function tryResolvePluginUrl(url: URL): Promise<PluginUrlResult | undefined> {
  return dprintPluginTagPatternMapper(dprintWasmPluginPattern, url, "plugin.wasm")
    ?? dprintPluginTagPatternMapper(dprintProcessPluginPattern, url, "plugin.json")
    ?? (await userRepoTagPatternMapper(userWasmPluginPattern, url, "plugin.wasm"))
    ?? (await userRepoTagPatternMapper(userProcessPluginPattern, url, "plugin.json"));
}

export async function tryResolveSchemaUrl(url: URL) {
  const result = await userRepoTagPatternMapper(userSchemaPattern, url, "schema.json");
  return result?.githubUrl;
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
    // when set, the cli writes an npm specifier into config files instead of the url
    npm: latestInfo.npm,
  };
}

export async function getLatestInfo(username: string, repoName: string, origin: string) {
  repoName = await getFullRepoName(username, repoName);
  const releaseInfo = await getLatestReleaseInfo(username, repoName);
  if (releaseInfo == null) {
    return undefined;
  }
  return getLatestInfoFromRelease(username, repoName, origin, releaseInfo);
}

export function getLatestInfoFromRelease(
  username: string,
  repoName: string,
  origin: string,
  releaseInfo: ReleaseInfo,
) {
  const displayRepoName = repoName.replace(/^dprint-plugin-/, "");
  const extension = releaseInfo.kind === "wasm" ? "wasm" : "json";
  const repoKey = `${username}/${repoName}`;
  const tagSuffix = RELEASE_TAG_SUFFIXES.get(repoKey);
  if (tagSuffix != null && !releaseInfo.tagName.endsWith(tagSuffix)) {
    return undefined;
  }
  const version = tagSuffix == null
    ? releaseInfo.tagName.replace(/^v/, "")
    : releaseInfo.tagName.slice(0, -tagSuffix.length);
  const url = tagSuffix == null
    ? username === "dprint"
      ? `${origin}/${displayRepoName}-${releaseInfo.tagName}.${extension}`
      : `${origin}/${username}/${displayRepoName}-${releaseInfo.tagName}.${extension}`
    : `${origin}/${username}/${repoName}/${releaseInfo.tagName}/asset/plugin.${extension}`;

  // include the bare minimum in case someone else wants to implement
  // this behaviour on their server
  return {
    schemaVersion: 1,
    url,
    version,
    checksum: releaseInfo.checksum,
    // the GitHub repo this plugin is published from (full name already resolved above)
    repoUrl: `https://github.com/${repoKey}`,
    // identifies this plugin's download analytics: the `username/repo` key that
    // downloads are recorded under and the tag of the latest release
    downloadKey: repoKey,
    tag: releaseInfo.tagName,
    // the npm package this plugin is published to, when it has one
    npm: npmPackagesByRepo.get(repoKey),
  };
}

function dprintPluginTagPatternMapper(
  pattern: URLPattern,
  url: URL,
  fileName: string,
): PluginUrlResult | undefined {
  const result = pattern.exec(url);
  if (result) {
    const pluginShortName = result.pathname.groups[0]!;
    const tag = result.pathname.groups[1]!;
    const repo = `dprint-plugin-${pluginShortName}`;
    const githubUrl = tag === "latest"
      ? `https://github.com/dprint/${repo}/releases/latest/download/${fileName}`
      : `https://github.com/dprint/${repo}/releases/download/${tag}/${fileName}`;
    return { githubUrl, username: "dprint", repo, tag };
  }
  return undefined;
}

async function userRepoTagPatternMapper(
  pattern: URLPattern,
  url: URL,
  fileName: string,
): Promise<PluginUrlResult | undefined> {
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
    const tag = result.pathname.groups[2]!;
    const githubUrl = tag === "latest"
      ? `https://github.com/${username}/${repo}/releases/latest/download/${fileName}`
      : `https://github.com/${username}/${repo}/releases/download/${tag}/${fileName}`;
    return { githubUrl, username, repo, tag };
  }
  return undefined;
}

function buildNpmPackagesByRepo() {
  const result = new Map<string, PluginNpmInfo>();
  for (const plugin of infoJson.latest as { name: string; npm?: PluginNpmInfo }[]) {
    if (plugin.npm == null) {
      continue;
    }
    const slashIndex = plugin.name.indexOf("/");
    const username = slashIndex === -1 ? "dprint" : plugin.name.slice(0, slashIndex);
    const shortName = plugin.name.slice(slashIndex + 1).replace(/^dprint-plugin-/, "");
    result.set(`${username}/${shortName}`, plugin.npm);
    result.set(`${username}/dprint-plugin-${shortName}`, plugin.npm);
  }
  return result;
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
