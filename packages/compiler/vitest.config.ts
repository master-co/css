import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

export default defineConfig({
  ...config,
  resolve: {
    alias: [
      {
        find: /^@master\/css-binding-wasm-compiler$/,
        replacement: fileURLToPath(new URL(
          '../binding-wasm-compiler/src/provider-node.ts',
          import.meta.url
        ))
      },
      {
        find: /^@master\/css-binding-wasm-engine$/,
        replacement: fileURLToPath(new URL(
          '../binding-wasm-engine/src/provider-node.ts',
          import.meta.url
        ))
      }
    ],
    tsconfigPaths: true
  }
})
