import type { Config } from 'techor'

const externalNativePackages = {
    name: 'external-native-packages',
    resolveId: {
        order: 'pre',
        handler(source: string) {
            if (/^(?:lightningcss(?:-.+)?|oxc-(?:parser|resolver|transform))(?:\/.*)?$/.test(source)) {
                return {
                    id: source,
                    external: true
                }
            }

            if (/^@oxc-(?:parser|resolver|transform)\/binding-[^/]+(?:\/package\.json)?$/.test(source)) {
                return {
                    id: source,
                    external: true
                }
            }

            if (source.endsWith('.node')) {
                return {
                    id: source,
                    external: true
                }
            }
        }
    }
} as const

const config: Config = {
    build: {
        esmShim: false,
        input: {
            plugins: [
                externalNativePackages
            ]
        },
        commonjs: {
            esmExternals: ['vscode'],
            extensions: [
                '.js',
                '.ts'
            ]
        },
        output: {
            inlineDynamicImports: true
        }
    }
}

export default config
