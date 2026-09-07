import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { defineConfig, type TsdownInputOption, type TsdownPlugin } from 'tsdown'

interface PackageJSON {
  name?: string
  types?: string
  exports?: unknown
}

const packageRoot = process.cwd()
const packageJSON = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as PackageJSON

const entryByPackageName: Record<string, TsdownInputOption> = {
  '@master/css-binding': [
    'src/index.ts',
    'src/browser.ts',
    'src/engine-binding.ts',
    'src/engine-binding-browser.ts',
    'src/engine-binding-node.ts',
    'src/compiler-binding.ts',
    'src/compiler-binding-browser.ts',
    'src/compiler-binding-node.ts',
    'src/tooling-binding.ts',
    'src/tooling-binding-browser.ts',
    'src/tooling-binding-node.ts'
  ],
  '@master/css-binding-wasm-compiler': ['src/provider.ts', 'src/provider-node.ts'],
  '@master/css-binding-wasm-engine': ['src/provider.ts', 'src/provider-node.ts'],
  '@master/css-binding-wasm-tooling': ['src/provider.ts', 'src/provider-node.ts'],
  '@master/css-language-server': ['src/index.ts', 'src/server.ts'],
  '@master/css-mcp': ['src/index.ts', 'src/bin/index.ts'],
  '@master/eslint-plugin-css': ['src/**/*.{js,ts}'],
  '@master/css-svelte': ['src/lib/*.ts']
}

const rootByPackageName: Record<string, string> = {
  '@master/css-svelte': 'src/lib'
}

const privateInternalPackagePattern = /^@master\/css-internal(?:\/|$)/

const externalLanguageSyntaxJSON: TsdownPlugin = {
  name: 'external-language-syntax-json',
  resolveId: {
    order: 'pre',
    handler(source) {
      if (/^\.\.\/(?:\.\.\/)?syntaxes\/master-css\.tmLanguage\.json$/.test(source)) {
        return {
          id: source,
          external: true
        }
      }
    }
  }
}

const externalVirtualModules: TsdownPlugin = {
  name: 'external-virtual-modules',
  resolveId: {
    order: 'pre',
    handler(source) {
      if (source.startsWith('virtual:')) {
        return {
          id: source,
          external: true
        }
      }
    }
  }
}

const relativeImportSpecifierPattern = /((?:\bfrom\s*|\bimport\s*)['"])(\.{1,2}\/[^'"]+)(['"])/g
const dynamicImportSpecifierPattern = /(\bimport\(['"])(\.{1,2}\/[^'"]+)(['"]\))/g

function addJSExtensionToRelativeSpecifier(match: string, prefix: string, specifier: string, suffix: string) {
  if (/[?#]/.test(specifier) || extname(specifier)) return match
  return `${prefix}${specifier}.js${suffix}`
}

const preserveDeclarationRelativeImports: TsdownPlugin = {
  name: 'preserve-declaration-relative-imports',
  renderChunk: {
    order: 'post',
    handler(code, chunk) {
      if (!chunk.fileName.endsWith('.d.ts')) return
      return code
        .replace(relativeImportSpecifierPattern, addJSExtensionToRelativeSpecifier)
        .replace(dynamicImportSpecifierPattern, addJSExtensionToRelativeSpecifier)
    }
  }
}

function hasExportTypes(exports: unknown): boolean {
  return exports !== undefined && JSON.stringify(exports).includes('"types"')
}

export default defineConfig({
  cwd: packageRoot,
  entry: entryByPackageName[packageJSON.name || ''] || ['src/**/*.ts', '!src/**/*.d.ts'],
  unbundle: true,
  root: rootByPackageName[packageJSON.name || ''] || 'src',
  tsconfig: './tsconfig.prod.json',
  fixedExtension: false,
  deps: {
    alwaysBundle: [privateInternalPackagePattern],
    dts: {
      alwaysBundle: [privateInternalPackagePattern],
      neverBundle: [/^[^./]/, /^\.{1,2}\//]
    }
  },
  plugins: [
    preserveDeclarationRelativeImports,
    externalVirtualModules,
    ...(packageJSON.name === '@master/css-language-service' ? [externalLanguageSyntaxJSON] : [])
  ],
  dts: Boolean(packageJSON.types || hasExportTypes(packageJSON.exports))
})
