import { renderToString } from "preact-render-to-string";
import type { PluginData, PluginsData } from "./readInfoFile.js";

// renders the full home page document for the given plugins data. kept free of
// any server/data imports so it can be rendered in isolation (e.g. previews).
export function renderHomeHtml(pluginsData: PluginsData) {
  const content = renderToString(renderPage(pluginsData));
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="theme-color" content="#1e1e1e" />
    <meta name="description" content="Latest plugin versions for dprint, the pluggable and configurable code formatting platform." />
    <title>Plugins - dprint</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/style.css" />
    <script>
      addEventListener("load", () => {
        let resetTimeout;
        for (const button of document.getElementsByClassName("copy-button")) {
          button.addEventListener("click", () => {
            const url = button.dataset.url;
            if (navigator.clipboard != null) {
              navigator.clipboard.writeText(url).catch(() => {});
            } else {
              // fallback for older browsers
              const textArea = document.createElement("textarea");
              textArea.value = url;
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand("copy");
              document.body.removeChild(textArea);
            }
            const original = button.textContent;
            button.textContent = "copied ✓";
            button.classList.add("copied");
            clearTimeout(resetTimeout);
            resetTimeout = setTimeout(() => {
              button.textContent = original;
              button.classList.remove("copied");
            }, 1600);
          });
        }
      });
    </script>
  </head>
  <body>
    ${content}
  </body>
</html>
`;
}

function renderPage(pluginsData: PluginsData) {
  return (
    <main class="page">
      <div class="topbar">
        <a class="docs-link" href="https://dprint.dev/plugins">dprint plugin docs <span>↗</span></a>
      </div>
      {renderPlugins(pluginsData)}
      {renderCommands()}
    </main>
  );
}

function renderCommands() {
  const commands: { cmd: string; desc: string }[] = [
    { cmd: "dprint config update", desc: "Automatically updates the plugins in a config file." },
    { cmd: "dprint add", desc: "Adds one of these plugins via a multi-select prompt." },
    { cmd: "dprint add <plugin-name>", desc: "Adds a plugin by name." },
    { cmd: "dprint add <gh-org>/<gh-repo>", desc: "Adds a plugin by GitHub repo." },
  ];
  return (
    <section class="commands">
      <h2>Helpful commands</h2>
      <ul>
        {commands.map((c) => (
          <li key={c.cmd}>
            <code>{c.cmd}</code> — {c.desc}
          </li>
        ))}
      </ul>
    </section>
  );
}

function renderPlugins(data: PluginsData) {
  return (
    <div class="plugin-table" role="table">
      <div class="plugin-table-head" role="row">
        <div role="columnheader">Plugin</div>
        <div role="columnheader">Latest URL</div>
        <div role="columnheader" class="num-col">Downloads (30d)</div>
        <div role="columnheader"></div>
      </div>
      {data.latest.map((plugin) => renderPlugin(plugin))}
    </div>
  );
}

function renderPlugin(plugin: PluginData) {
  return (
    <div class="plugin-row" role="row" key={plugin.name}>
      <div class="col-name" role="cell">
        <span class="swatch"></span>
        <span class="name-text">{plugin.name}</span>
        {plugin.version ? <span class="version-tag">{plugin.version}</span> : null}
      </div>
      <div class="col-url" role="cell">
        <code>{plugin.url}</code>
      </div>
      <div class="col-downloads num-col" role="cell">
        <span class="dl-label">Downloads (30d) </span>
        {plugin.downloadCount.allVersions?.toLocaleString("en-US")}
      </div>
      <div class="col-action" role="cell">
        <button type="button" class="copy-btn copy-button" title="Copy URL to clipboard" data-url={plugin.url}>
          copy
        </button>
      </div>
    </div>
  );
}
