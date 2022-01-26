/** @jsx h */
import { h } from "https://x.lcas.dev/preact@10.5.12/mod.js";
import { renderToString } from "https://x.lcas.dev/preact@10.5.12/ssr.js";
import { getPluginsInfoData, PluginData, PluginsData } from "./plugins.ts";

let cachedRender: Promise<string> | undefined;

export function renderHome() {
  if (cachedRender == null) {
    cachedRender = innerRender();
    cachedRender.catch(err => {
      console.error(`Error rendering home: ${err}`);
      cachedRender = undefined;
    });
  }
  return cachedRender;
}

async function innerRender() {
  const content = await renderContent();
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="description" content="Latest plugin versions for dprint." />
    <title>Latest Plugins - dprint</title>
    <script>
      addEventListener("load", () => {
        for (const button of document.getElementsByClassName("copy-button")) {
          button.addEventListener("click", () => {
            // hack to copy to clipboard
            const textArea = document.createElement("textarea");
            textArea.value = button.dataset.url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
          });
        }
      });
    </script>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    ${content}
  </body>
</html>
`;
}

async function renderContent() {
  const pluginsData = await getPluginsInfoData();
  const section = (
    <section id="content">
      <h1>Latest Plugins</h1>
      {renderPlugins(pluginsData)}
      <p>
        Run <code>dprint config update</code> to automatically update the plugins in a config file.
      </p>
    </section>
  );
  return renderToString(section);
}

function renderPlugins(data: PluginsData) {
  return (
    <div id="plugins">
      <div id="plugins-header">
        <div>Name</div>
        <div>URL</div>
        <div></div>
      </div>
      {data.latest.map(plugin => renderPlugin(plugin))}
    </div>
  );
}

function renderPlugin(plugin: PluginData) {
  return (
    <div className="plugin" key={plugin.name}>
      <div>{plugin.name}</div>
      <div>{plugin.url}</div>
      <div>
        <button className="copy-button" title="Copy to clipboard" data-url={plugin.url}>
          Copy
        </button>
      </div>
    </div>
  );
}
