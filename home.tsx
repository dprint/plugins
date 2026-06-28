import { renderHomeHtml } from "./homeView.jsx";
import { readInfoFile } from "./readInfoFile.js";

export async function renderHome(origin: string, ctx?: ExecutionContext) {
  const pluginsData = await readInfoFile(origin, ctx);
  return renderHomeHtml(pluginsData);
}
