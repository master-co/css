import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const browserBackendBroker = {
  name: 'browser-backend-broker',
  resolveId: {
    order: 'pre' as const,
    handler(source: string) {
      if (source === '@master/css-backend/engine') {
        return fileURLToPath(new URL(
          '../native/src/broker-engine-browser.ts',
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
    plugins: [browserBackendBroker],
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
    plugins: [browserBackendBroker],
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
