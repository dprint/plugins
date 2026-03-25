import infoJson from "./info.json" with { type: "json" };
import { getLatestInfo } from "./plugins.js";
import { getAllDownloadCount } from "./utils/github.js";

// only typing what's used on the server
export interface PluginsData {
  latest: PluginData[];
}

export interface PluginData {
  name: string;
  url: string;
  version: string;
  downloadCount: {
    currentVersion: number;
    allVersions: number;
  };
}

export async function readInfoFile(origin: string): Promise<Readonly<PluginsData>> {
  return {
    ...infoJson,
    latest: await getLatest(infoJson.latest),
  };

  async function getLatest(latest: typeof infoJson.latest) {
    const results = [];
    for (const plugin of latest) {
      const [username, pluginName] = plugin.name.split("/");
      const info = pluginName
        ? await getLatestInfo(username, pluginName, origin)
        : await getLatestInfo("dprint", plugin.name, origin);
      if (info != null) {
        results.push({
          ...plugin,
          version: info.version,
          url: info.url,
          downloadCount: {
            currentVersion: info.downloadCount,
            allVersions: pluginName
              ? await getAllDownloadCount(username, pluginName)
              : await getAllDownloadCount("dprint", plugin.name),
          },
        });
      }
    }
    return results;
  }
}
