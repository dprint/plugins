import { getLatestInfo } from "./plugins.ts";
import { createAsyncLazy } from "./utils/mod.ts";

const infoLazy = createAsyncLazy<Readonly<PluginsData>>(async () => {
  const data = await Deno.readTextFile("./info.json");
  return JSON.parse(data);
});

// only typing what's used on the server
export interface PluginsData {
  latest: PluginData[];
}

export interface PluginData {
  name: string;
  url: string;
  version: string;
}

export async function readInfoFile(): Promise<Readonly<PluginsData>> {
  const infoObj = await infoLazy.get();
  return {
    ...infoObj,
    latest: await getLatest(infoObj.latest),
  };

  async function getLatest(latest: Readonly<PluginData>[]) {
    const results = [];
    for (const plugin of latest) {
      const [username, pluginName] = plugin.name.split("/");
      const info = pluginName
        ? await getLatestInfo(username, pluginName)
        : await getLatestInfo("dprint", plugin.name);
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
