import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

function isBundledJSONModule(id: string) {
  const normalizedId = id.replaceAll('\\', '/')
  return normalizedId.endsWith('/packages/preset/src/default-manifest.json')
    || /\/mdn-data\/css\/(?:properties|selectors|syntaxes)\.json$/.test(normalizedId)
}

const bundledJSONModules = {
  name: 'bundled-json-modules',
  load(id: string) {
    if (!isBundledJSONModule(id)) return
    const code = readFileSync(id, 'utf8')
    return {
      code: `export default ${code};`,
      moduleType: 'js'
    }
  }
} as const

const externalVSCodeHostModule = {
  name: 'external-vscode-host-module',
  resolveId: {
    order: 'pre',
    handler(source: string) {
      if (source === 'vscode') {
        return {
          id: source,
          external: true
        }
      }
    }
  }
} as const

const externalNativeAddons = {
  name: 'external-native-addons',
  resolveId: {
    order: 'pre',
    handler(source: string) {
      if (source.endsWith('.node')) {
        return {
          id: source,
          external: true
        }
      }
    }
  }
} as const

const commonConfig = {
  platform: 'node',
  tsconfig: './tsconfig.prod.json',
  fixedExtension: false,
  shims: false,
  dts: false,
  deps: {
    onlyBundle: false
  },
  minify: true,
  plugins: [
    bundledJSONModules,
    externalVSCodeHostModule,
    externalNativeAddons
  ],
  outputOptions: {
    codeSplitting: false,
    comments: false
  }
} as const

export default defineConfig([
  {
    ...commonConfig,
    entry: {
      'extension.min': 'src/extension.min.ts'
    }
  },
  {
    ...commonConfig,
    entry: {
      'server.min': 'src/server.min.ts'
    }
  }
])
