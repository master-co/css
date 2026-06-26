import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type TsdownInputOption, type TsdownPlugin } from 'tsdown'

interface PackageJSON {
    name?: string
    types?: string
    exports?: unknown
}

const packageRoot = process.cwd()
const packageJSON = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as PackageJSON

const entryByPackageName: Record<string, TsdownInputOption> = {
    '@master/css-preset': ['src/**/*.ts', '!src/**/*.d.ts'],
    '@master/css.react': ['src/**/*.tsx'],
    '@master/eslint-plugin-css': ['src/**/*.{js,ts}']
}

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

function hasExportTypes(exports: unknown): boolean {
    return exports !== undefined && JSON.stringify(exports).includes('"types"')
}

export default defineConfig({
    cwd: packageRoot,
    entry: entryByPackageName[packageJSON.name || ''] || ['src/**/*.ts'],
    unbundle: true,
    root: 'src',
    tsconfig: './tsconfig.prod.json',
    fixedExtension: false,
    deps: {
        skipNodeModulesBundle: true,
        dts: {
            neverBundle: [/^[^./]/]
        }
    },
    plugins: [
        externalVirtualModules,
        ...(packageJSON.name === '@master/css-language' ? [externalLanguageSyntaxJSON] : [])
    ],
    dts: Boolean(packageJSON.types || hasExportTypes(packageJSON.exports))
})
