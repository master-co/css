<br>
<div align="center">

<p align="center">
  <a href="https://css.master.co">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/33840671/201701649-3bb7d698-abec-4d5f-ac30-ccc4d7bafcd4.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/33840671/201703010-77bf2373-9899-40cc-98f5-30cf9b546941.svg">
      <img alt="Master CSS" src="https://user-images.githubusercontent.com/33840671/201703010-77bf2373-9899-40cc-98f5-30cf9b546941.svg" width="100%">
    </picture>
  </a>
</p>

</div>

## Master CSS Nuxt example

This example registers `@master/css-nuxt` in `nuxt.config.ts` and uses its default `static` mode. The global style block in `app.vue` imports `@master/css`.

Install and build the workspace packages from the repository root, then start the example:

```sh
bun install --frozen-lockfile
bun run build
cd examples/nuxt.js
bun run dev
```

Open the URL printed by Nuxt. From this directory, run `bun run build`, then `bun run preview` to inspect the production build. Use `bun run generate` to produce a prerendered site.

Nuxt also supports `runtime`, `prerender`, and `progressive`. The module uses Nitro to render CSS from HTML in `prerender` and `progressive`. See the [Nuxt installation guide](https://css.master.co/guide/installation/nuxtjs).
