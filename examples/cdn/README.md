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
<p align="center">Master CSS Runtime CDN out of the box in the browser</p>

<p align="center">
  <a aria-label="overview" href="https://github.com/master-co/css/tree/rc">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/%E2%AC%85%20back-%20?color=212022&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/badge/%E2%AC%85%20back-%20?color=f6f7f8&style=for-the-badge">
      <img alt="NPM Version" src="https://img.shields.io/badge/%E2%AC%85%20back-%20?color=f6f7f8&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
      <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
    </picture>
  </a>
  <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css?color=212022&label=%20&logo=npm&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
      <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="JSDelivr" href="https://www.jsdelivr.com/package/npm/@master/css">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css?color=212022&label=%20&logo=jsdelivr&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
      <img alt="JSDelivr hits (npm scoped)" src="https://img.shields.io/jsdelivr/npm/hm/@master/css?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Follow @mastercorg" href="https://twitter.com/mastercorg">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=212022&logo=twitter&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
      <img alt="Follow @mastercorg" src="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Github Actions" href="https://github.com/master-co/css/actions/workflows/release.yml">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/release.yml?branch=rc&label=%20&color=212022&logo=githubactions&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/release.yml?branch=rc&label=%20&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
      <img alt="Github release actions" src="https://img.shields.io/github/actions/workflow/status/master-co/css/release.yml?branch=rc&label=%20&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
    </picture>
  </a>
</p>

</div>

This template targets the CSS-first runtime. Replace every `VERSION` with the same published CSS-first version of the runtime and preset. The current `rc` channel still serves the earlier RC88 runtime and cannot run this example. Until a matching release is available, use the local files described below.

```html
<!DOCTYPE html>
<html lang="en" hidden>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preload" as="style" href="https://cdn.master.co/css-preset@VERSION/src/base.css">
  <link rel="preload" as="script" href="https://cdn.master.co/css-runtime@VERSION">
  <link rel="preload" as="fetch" crossorigin href="https://cdn.jsdelivr.net/npm/@master/css-runtime@VERSION/dist/default-program.bin">
  <link rel="stylesheet" href="https://cdn.master.co/css-preset@VERSION/src/base.css">
  <script src="https://cdn.master.co/css-runtime@VERSION"></script>
</head>
<body>
  <h1 class="m-2xl italic font-5xl font-heavy fg-text-strong">Hello World</h1>
</body>
</html>
```

The script starts automatically. It loads its compiled `dist/default-program.bin`, waits for the document to finish parsing, generates the initial classes, then removes `hidden`. Later class changes are observed automatically. The binary is fetched data, so its preload uses `as="fetch" crossorigin`; it is not a JavaScript or JSON module. Its URL points directly to jsDelivr because the Master CDN redirect does not carry CORS headers. The runtime uses the same destination.

For a local build, serve these three files in the same directory:

- `packages/preset/src/base.css` as `base.css`
- `packages/runtime/dist/global.min.js` as `global.min.js`
- `packages/runtime/dist/default-program.bin` as `default-program.bin`

In `iife.html`, replace both stylesheet URLs with `./base.css`, both script URLs with `./global.min.js`, and the program preload URL with `./default-program.bin`. Serve the directory over HTTP. Build the runtime before copying its outputs; keep the script and program from the same build.

`hidden` prevents the unstyled first paint. Handled program errors or the runtime's three-second startup timeout reveal the content. If JavaScript is disabled or the script itself cannot load, it cannot remove `hidden`; omit that attribute when readability must survive those cases, or use static CSS.

## Documentation
Check out the official [CDN installation guide](https://css.master.co/guide/installation#cdn).
