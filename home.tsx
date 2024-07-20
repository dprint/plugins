/** @jsx h */
import { h } from "preact";
import { renderToString } from "preact-render-to-string";
import { PluginData, PluginsData, readInfoFile } from "./readInfoFile.ts";

export async function renderHome() {
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
  const pluginsData = await readInfoFile();
  const section = (
    <section id="content">
      <h1>Latest Plugins</h1>
      {renderPlugins(pluginsData)}
      <p>
        Helpful commands:
        <ul>
          <li>
            <code>dprint config update</code> - Automatically updates the plugins in a config file.
          </li>
          <li>
            <code>dprint config add</code> - Adds one of these plugins via a multi-select prompt.
          </li>
          <li>
            <code>dprint config add &lt;plugin-name&gt;</code> - Adds a plugin by name.
          </li>
          <li>
            <code>dprint config add &lt;gh-org&gt;/&lt;gh-repo&gt;</code> - Adds a plugin by GitHub repo.
          </li>
        </ul>
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
        <div>Latest URL</div>
        <div>Downloads</div>
        <div></div>
      </div>
      {data.latest.map((plugin) => renderPlugin(plugin))}
    </div>
  );
}

function renderPlugin(plugin: PluginData) {
  return (
    <div className="plugin" key={plugin.name}>
      <div>{plugin.name}</div>
      <div>{plugin.url}</div>
      <div>{plugin.downloadCount.allVersions?.toLocaleString("en-US")}</div>
      <div>
        <button className="copy-button" title="Copy to clipboard" data-url={plugin.url}>
          Copy
        </button>
      </div>
    </div>
  );
}
