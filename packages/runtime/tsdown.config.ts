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

// The global bundle inlines the lazy engine import as a namespace; re-export only
// createEngine so the render APIs of @master/css stay tree-shaken.
const globalEngineModule = '\0master-css-global-engine'
const globalEngineLoader = {
  name: 'global-engine-loader',
  resolveId: {
    order: 'pre' as const,
    handler(source: string, importer?: string) {
      if (source === '@master/css' && importer !== globalEngineModule) return globalEngineModule
    }
  },
  load(id: string) {
    if (id === globalEngineModule) return `export { createEngine } from '@master/css'`
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
    // The inlined engine initializes lazily, after document.currentScript is
    // cleared; capture the script URL while the bundle first runs.
    define: {
      'import.meta.url': 'masterCSSRuntimeScriptURL'
    },
    tsconfig: './tsconfig.prod.json',
    dts: false,
    plugins: [globalEngineLoader, browserBindingLoader],
    deps: {
      alwaysBundle: [/^[^./]/],
      onlyBundle: false
    },
    minify: true,
    outputOptions: {
      entryFileNames: '[name].js',
      codeSplitting: false,
      comments: false,
      intro: 'const masterCSSRuntimeScriptURL = document.currentScript?.src || globalThis.location.href'
    }
  }
])
