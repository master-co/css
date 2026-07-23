import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

export default defineConfig({
  ...config,
  resolve: {
    alias: [
      {
        find: /^@master\/css-wasm-compiler$/,
        replacement: fileURLToPath(new URL(
          '../wasm-compiler/src/provider-node.ts',
          import.meta.url
        ))
      },
      {
        find: /^@master\/css-wasm-engine$/,
        replacement: fileURLToPath(new URL(
          '../wasm-runtime/src/provider-node.ts',
          import.meta.url
        ))
      },
      {
        find: /^@master\/css-wasm-tooling$/,
        replacement: fileURLToPath(new URL(
          '../wasm-tooling/src/provider-node.ts',
          import.meta.url
        ))
      }
    ],
    tsconfigPaths: true
  }
})
