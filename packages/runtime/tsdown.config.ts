import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const wasmEngineLoader = fileURLToPath(new URL('../binding-wasm-engine/src/index.ts', import.meta.url))

const browserBindingLoader = {
  name: 'browser-binding-loader',
  resolveId: {
    order: 'pre' as const,
    handler(source: string, importer?: string) {
      if (source === '@master/css-binding/engine') {
        return fileURLToPath(new URL(
          '../binding/src/engine-binding-browser.ts',
          import.meta.url
        ))
      }
      if (source === '@master/css-binding-wasm-engine') {
        return fileURLToPath(new URL(
          '../binding-wasm-engine/src/provider.ts',
          import.meta.url
        ))
      }
      // Pair the bundled bindings with the runtime-only module that
      // `cargo xtask build-wasm runtime` generates beside the staged Wasm asset.
      if (
        source === '../artifacts/mastercss_binding_wasm_engine.js'
        && importer && resolve(importer) === wasmEngineLoader
      ) {
        return fileURLToPath(new URL(
          './artifacts/mastercss_binding_wasm_engine.js',
          import.meta.url
        ))
      }
    }
  }
}

export default defineConfig([
  {
    entry: ['src/**/*.ts'],
    unbundle: true,
    root: 'src',
    tsconfig: './tsconfig.prod.json',
    fixedExtension: false,
    dts: {
      emitDtsOnly: true
    },
    deps: {
      dts: {
        neverBundle: [/^[^./]/, /^\.{1,2}\//]
      }
    },
    copy: {
      from: '../preset/src/default-manifest.json',
      to: 'dist'
    }
  },
  {
    entry: {
      index: 'src/index.ts'
    },
    platform: 'browser',
    tsconfig: './tsconfig.prod.json',
    dts: false,
    plugins: [browserBindingLoader],
    outputOptions: {
      entryFileNames: '[name].js',
      codeSplitting: false
    }
  },
  {
    entry: {
      'global.min': 'src/global.min.ts'
    },
    platform: 'browser',
    define: {
      'import.meta.url': '(document.currentScript?.src || globalThis.location.href)'
    },
    tsconfig: './tsconfig.prod.json',
    dts: false,
    plugins: [browserBindingLoader],
    deps: {
      alwaysBundle: [/^[^./]/],
      onlyBundle: false
    },
    minify: true,
    outputOptions: {
      entryFileNames: '[name].js',
      codeSplitting: false,
      comments: false
    }
  }
])
