const fs = require("fs");
const [pluginName, version, fileName] = process.argv.slice(2);

const infoText = fs.readFileSync("info.json", { encoding: "utf8" });
const info = JSON.parse(infoText);

const plugin = info.latest.find(plugin => plugin.name === pluginName);
if (plugin == null) {
  throw new Error(`Could not find plugin: ${pluginName}`);
}

plugin.version = version;
plugin.url = `https://plugins.dprint.dev/${fileName}.wasm`;

fs.writeFileSync("info.json", JSON.stringify(info, undefined, 2) + "\n");
