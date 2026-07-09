import { createRequire, registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const typescript6Url = pathToFileURL(require.resolve('typescript6/lib/typescript.js')).href

const legacyCompilerApiPackages = [
    '@angular-devkit/build-angular',
    '@angular/compiler-cli',
    '@ngtools/webpack',
    '@nuxt/module-builder',
    '@sveltejs/package',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    '@typescript-eslint/type-utils',
    '@typescript-eslint/typescript-estree',
    'mkdist',
    'rollup-plugin-dts',
    'svelte-check',
    'svelte2tsx',
    'ts-api-utils',
    'ts-jest',
    'typescript-eslint',
    'unbuild',
    'vite-plugin-checker',
    'vue-tsc'
]

const legacyCompilerApiPackagePaths = legacyCompilerApiPackages.map((packageName) => `/node_modules/${packageName}/`)

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === 'typescript' && context.parentURL) {
            const parentURL = context.parentURL.replaceAll('\\', '/')
            if (legacyCompilerApiPackagePaths.some((packagePath) => parentURL.includes(packagePath))) {
                return {
                    shortCircuit: true,
                    url: typescript6Url
                }
            }
        }

        return nextResolve(specifier, context)
    }
})
