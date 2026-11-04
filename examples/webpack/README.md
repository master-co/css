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

## Master CSS Webpack example

This example uses `MasterCSSPlugin` from `@master/css-webpack` in its default `static` mode, alongside `HtmlWebpackPlugin`. `src/index.js` imports the shared `src/style.css` stylesheet.

Install and build the workspace packages from the repository root, then start the example:

```sh
bun install --frozen-lockfile
bun run build
cd examples/webpack
bun run dev
```

Open the URL printed by Webpack. From this directory, run `bun run build` to generate the production files in `dist/`.

See the [Webpack installation guide](https://rc.css.master.co/guide/installation/webpack).
