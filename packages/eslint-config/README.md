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

The package is a thin entrypoint over
`@master/eslint-plugin-css/configs.recommended`; rules and config policy remain
owned by the plugin.
