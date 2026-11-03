# css.master.co (v1)

The Master CSS v1 documentation site, frozen as a static export and hosted on Cloudflare Pages.

It is a Next.js 12 app whose pages are all statically generated. `next export` does not support i18n, so `export.mjs` assembles `out/` from the prerendered `next build` output, including `_redirects` and `_headers` for Pages. Nothing runs on a server.

## Build

Requires Node.js 18 and pnpm 8.

```bash
pnpm install
pnpm build
```

## Preview and deploy

```bash
pnpm preview
pnpm deploy
```

`wrangler.jsonc` targets the `master-css-v1` Pages project.
