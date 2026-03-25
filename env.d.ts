declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.txt" {
  const content: string;
  export default content;
}

interface Env {
  DPRINT_PLUGINS_GH_TOKEN?: string;
  PLUGIN_CACHE: R2Bucket;
}
