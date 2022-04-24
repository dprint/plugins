# plugins.dprint.dev

Website for [https://plugins.dprint.dev](https://plugins.dprint.dev).

This website is hosted on [Deno Deploy](https://deno.com/deploy).

## Redirect to Any GitHub Repo (For Plugin Authors)

This service provides a convenient redirect for a plugin stored in any GitHub repo.

To use it, create a GitHub release in your repo with:

1. Plugin named `plugin.wasm` (use `plugin.json` for process plugins)
1. JSON schema named `schema.json` (if exists)

Then your redirect urls will look like:

```
https://plugins.dprint.dev/<username>/<repo_name>-<tag_name>.wasm
https://plugins.dprint.dev/<username>/<repo_name>/<tag_name>/schema.json
https://plugins.dprint.dev/<username>/<repo_name>/latest.json
```

Restrictions and recommendations:

1. Tag names must not contain a dash (`-`).
1. It is recommended to use the format `x.x.x` for your tag names to be consistent with other plugins (ex. no leading `v` like `v1.0.0`).

If your repo name is in the format `dprint-plugin-<something>` then you can omit `dprint-plugin-` in the `<repo_name>` for the redirect (ex. `https://plugins.dprint.dev/<user>/dprint-plugin-typescript-0.0.0.wasm` may be shortened to `https://plugins.dprint.dev/<user>/typescript-0.0.0.wasm`).

## Run Locally

```bash
deno run --allow-read=. --allow-net --allow-env --no-check main.ts
```
