import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

export default defineConfig({
  ...config,
  resolve: {
    ...config.resolve,
    alias: [{
      find: /^@master\/css-binding-wasm-tooling$/,
      replacement: fileURLToPath(new URL('../binding-wasm-tooling/src/provider-node.ts', import.meta.url))
    }]
  }
})
