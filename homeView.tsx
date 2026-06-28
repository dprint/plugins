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
    <title>Plugins - dprint - Code Formatter</title>
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
    <>
      <nav class="site-nav" aria-label="Main">
        <div class="nav-inner">
          <a class="brand" href="https://dprint.dev">dprint</a>
          <div class="nav-links">
            <a href="https://dprint.dev/overview">Overview</a>
            <a href="https://dprint.dev/playground">Playground</a>
            <a href="/" class="active">Plugins</a>
            <a href="https://dprint.dev/sponsor">Sponsor</a>
            <a class="gh-button" href="https://github.com/dprint/dprint" rel="noopener noreferrer">GitHub <span>↗</span></a>
          </div>
        </div>
      </nav>

      <main class="site-main">
        <section class="hero">
          <div class="hero-glow"></div>
          <div class="hero-inner">
            <div class="hero-kicker">// plugin registry</div>
            <h1 class="hero-title">Plugins</h1>
            <p class="hero-sub">
              The latest version of every dprint plugin, with a copy-paste URL for your{" "}
              <code>dprint.json</code>. Updated automatically from each plugin's GitHub releases.
            </p>
          </div>
        </section>

        {renderPlugins(pluginsData)}
        {renderCommands()}
        {renderCta()}
      </main>

      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-brand">dprint</div>
          <div class="footer-links">
            <a href="https://dprint.dev">Home</a>
            <a href="https://dprint.dev/plugins">Documentation</a>
            <a href="https://twitter.com/dprintfmt">Twitter</a>
            <a href="https://github.com/dprint">GitHub</a>
          </div>
          <div class="footer-tag">A code formatting platform · Rust + Wasm</div>
        </div>
      </footer>
    </>
  );
}

function renderPlugins(data: PluginsData) {
  return (
    <section class="home-section registry">
      <div class="eyebrow">// latest versions</div>
      <h2>Grab a plugin URL.</h2>
      <p>Drop any of these into the <code>plugins</code> array of your <code>dprint.json</code>, or let the CLI manage them for you.</p>

      <div class="plugin-table" role="table">
        <div class="plugin-table-head" role="row">
          <div role="columnheader">Plugin</div>
          <div role="columnheader">Latest URL</div>
          <div role="columnheader" class="num-col">Downloads (30d)</div>
          <div role="columnheader"></div>
        </div>
        {data.latest.map((plugin) => renderPlugin(plugin))}
      </div>
    </section>
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

function renderCommands() {
  const commands: { cmd: string; desc: string }[] = [
    { cmd: "dprint config update", desc: "Automatically updates the plugins in a config file." },
    { cmd: "dprint add", desc: "Adds one of these plugins via a multi-select prompt." },
    { cmd: "dprint add <plugin-name>", desc: "Adds a plugin by name." },
    { cmd: "dprint add <gh-org>/<gh-repo>", desc: "Adds a plugin by GitHub repo." },
  ];
  return (
    <section class="home-section commands">
      <div class="eyebrow">// commands</div>
      <h2>Let the CLI do it.</h2>
      <p>Skip the copy-paste — dprint can add and update plugins for you.</p>
      <div class="command-grid">
        {commands.map((c) => (
          <div class="command-card" key={c.cmd}>
            <code>{c.cmd}</code>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderCta() {
  return (
    <section class="home-section cta">
      <div class="cta-card">
        <div class="cta-glow"></div>
        <div class="cta-inner">
          <div class="cta-title">dprint fmt</div>
          <p>Read the docs to configure each plugin, or learn how to publish your own to this registry.</p>
          <div class="cta-actions">
            <a class="btn-primary" href="https://dprint.dev/plugins">Plugin docs</a>
            <a class="btn-secondary" href="https://github.com/dprint/dprint-plugins" rel="noopener noreferrer">Publish a plugin</a>
          </div>
        </div>
      </div>
    </section>
  );
}
