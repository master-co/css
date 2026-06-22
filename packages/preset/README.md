# @master/css-preset

The default Master CSS preset source and compiled manifest.

## Installation

```bash
npm install @master/css-preset
```

Most applications should import preset styles through `@master/css`. Use this package directly when tooling needs the preset package boundary.

## CSS entries

```css
@import '@master/css-preset';
@import '@master/css-preset/base.css';
@import '@master/css-preset/theme.css';
@import '@master/css-preset/variants.css';
@import '@master/css-preset/utilities.css';
```

The default index entry contains:

```css
@import "./base.css";
@import "./theme.css";
@import "./variants.css";
@import "./utilities.css";
```

`base.css` declares the stable cascade layer order:

```css
@layer theme, base, defaults, components, utilities;
```

## Manifest

The compiled default manifest is available as JSON:

```ts
import defaultManifest from '@master/css-preset/default-manifest.json'
```

The generated manifest is derived from the preset CSS source. Do not edit generated manifest output by hand.

## Related packages

- `@master/css` re-exports the preset CSS entries for application use.
- `@master/css-engine` owns built-in key aliases and native value namespaces.
- `@master/css-compiler` compiles preset CSS source into manifest data.
