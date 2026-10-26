import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const runtimeArtifactModule = fileURLToPath(new URL('../binding-wasm-engine/src/runtime-artifact.ts', import.meta.url))
const globalRuntimeArtifact = '\0master-css-global-runtime-artifact'

const browserBindingLoader = {
  name: 'browser-binding-loader',
  resolveId: {
    order: 'pre' as const,
    handler(source: string) {
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
    }
  }
}

// The CDN serves the runtime Wasm from this package's `artifacts/` beside `dist/`,
// so the global bundle resolves it against its script URL instead of the binding's.
const globalRuntimeArtifactLoader = {
  name: 'global-runtime-artifact-loader',
  resolveId: {
    order: 'pre' as const,
    handler(source: string, importer?: string) {
      if (importer && resolve(dirname(importer), `${source}.ts`) === runtimeArtifactModule) {
        return globalRuntimeArtifact
      }
    }
  },
  load(id: string) {
    if (id !== globalRuntimeArtifact) return
    const bindings = fileURLToPath(new URL(
      '../binding-wasm-engine/artifacts/runtime/mastercss_binding_wasm_engine.js',
      import.meta.url
    ))
    return [
      'export const runtimeWasmURL = new URL(\'../artifacts/mastercss_binding_wasm_engine_bg.wasm\', import.meta.url)',
      `export const loadRuntimeBindings = () => import(${JSON.stringify(bindings)})`
    ].join('\n')
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

// The CDN bundle fetches the default preset's runtime program beside its script,
// and bundler apps without a Master CSS plugin import it inline from
// `@master/css-runtime/default-program`. It is compiled from the preset manifest on
// every build, so it always matches the engine that executes it.
const defaultProgram = {
  name: 'default-program',
  async generateBundle(this: { emitFile(file: { type: 'asset', fileName: string, source: Uint8Array | string }): string }) {
    const { compileRuntimeProgram } = await import('@master/css/node')
    const manifest = JSON.parse(readFileSync(new URL('../preset/src/default-manifest.json', import.meta.url), 'utf8'))
    const program = await compileRuntimeProgram(manifest)
    this.emitFile({ type: 'asset', fileName: 'default-program.bin', source: program })
    this.emitFile({
      type: 'asset',
      fileName: 'default-program.js',
      source: [
        `const program = atob(${JSON.stringify(Buffer.from(program).toString('base64'))})`,
        'export const defaultProgram = Uint8Array.from(program, character => character.charCodeAt(0))',
        ''
      ].join('\n')
    })
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
  },
  {
    entry: {
      index: 'src/index.ts'
    },
    platform: 'browser',
    tsconfig: './tsconfig.prod.json',
    dts: false,
    plugins: [browserBindingLoader, defaultProgram],
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
    plugins: [globalEngineLoader, globalRuntimeArtifactLoader, browserBindingLoader],
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
