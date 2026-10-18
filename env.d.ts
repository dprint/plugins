declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.txt" {
  const content: string;
  export default content;
}

declare namespace Cloudflare {
  interface Env {
    DPRINT_PLUGINS_GH_TOKEN?: string;
    // account id and a token with Account Analytics read access, used to query
    // download counts back out of the analytics engine dataset
    CLOUDFLARE_ACCOUNT_ID?: string;
    DPRINT_PLUGINS_ANALYTICS_TOKEN?: string;
    PLUGIN_CACHE: R2Bucket;
    DPRINT_PLUGIN_DOWNLOAD_ANALYTICS: AnalyticsEngineDataset;
  }
}
