import infoJson from "./info.json" with { type: "json" };
import { getLatestInfo } from "./plugins.js";

// only typing what's used on the server
export interface PluginsData {
  latest: PluginData[];
}

export interface PluginData {
  name: string;
  url: string;
  version: string;
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
        });
      }
    }
    return results;
  }
}
