# `@master/eslint-config-css`

Official Master CSS flat ESLint configuration.

```bash
npm install -D @master/eslint-config-css
```

```js
import { defineConfig } from 'eslint/config'
import masterCSS from '@master/eslint-config-css'

export default defineConfig([
  ...masterCSS
])
```

The package delegates to the matching `@master/eslint-plugin-css` implementation;
rules and config policy remain owned by the plugin.
