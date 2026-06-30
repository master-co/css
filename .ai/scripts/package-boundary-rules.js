export const sourceFileExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.vue', '.svelte'])

export const bundledSourcePackages = new Set([
    '@master/css.figma',
    'master-css-vscode'
])

export const strictProductionDependencies = new Map([
    ['@master/css-schema', []],
    ['@master/css-lexer', []],
    ['@master/css-preset', ['@master/css-schema']],
    ['@master/css-source', ['@master/css-lexer']],
    ['@master/css-engine', ['@master/css-lexer', '@master/css-schema']],
    ['@master/css', ['@master/css-engine', '@master/css-preset']],
    ['@master/css-compiler', ['@master/css-engine', '@master/css-lexer', '@master/css-schema', '@master/css-preset']],
    ['@master/css-project', ['@master/css-compiler', '@master/css-integration', '@master/css-lexer', '@master/css-preset', '@master/css-schema']],
    ['@master/css-integration', ['@master/css-engine', '@master/css-schema']],
    ['@master/css-runtime', ['@master/css-engine', '@master/css-preset', '@master/css-schema']],
    ['@master/css-stylesheet', ['@master/css', '@master/css-compiler', '@master/css-engine', '@master/css-integration', '@master/css-lexer', '@master/css-source', '@master/css-validator', '@master/css-schema', '@master/css-preset']],
    ['@master/css-validator', ['@master/css', '@master/css-preset', '@master/css-schema']],
    ['@master/css-server', ['@master/css', '@master/css-preset', '@master/css-validator', '@master/css-schema', '@master/css-compiler']],
    ['@master/css-scanner', ['@master/css', '@master/css-preset', '@master/css-source', '@master/css-validator', '@master/css-schema', '@master/css-lexer', '@master/css-compiler']],
    ['@master/css-lint', ['@master/css-engine', '@master/css-language', '@master/css-lexer', '@master/css-schema', '@master/css-validator', '@master/css-preset']],
    ['@master/css-diagnostics', ['@master/css-project', '@master/css-scanner', '@master/css-stylesheet']]
])

export const forbiddenProductionDependencies = new Map([
    ['@master/css-engine', ['@master/css-compiler', '@master/css-integration', '@master/css-runtime', '@master/css-server', '@master/css-scanner', '@master/css-language', '@master/css-language-service', '@master/eslint-plugin-css', '@master/css-cli']],
    ['@master/css-schema', ['@master/css-engine', '@master/css-compiler', '@master/css-integration', '@master/css-runtime', '@master/css-server', '@master/css-scanner']],
    ['@master/css-lexer', ['@master/css-engine', '@master/css-compiler', '@master/css-source', '@master/css-scanner', '@master/css-language']],
    ['@master/css-source', ['@master/css-engine', '@master/css-compiler', '@master/css-scanner', '@master/css-runtime', '@master/css-server', '@master/css-language-service', '@master/eslint-plugin-css']],
    ['@master/css-stylesheet', ['@master/css-scanner']],
    ['@master/css-lint', ['@master/eslint-plugin-css', '@master/css-project', '@master/css-scanner', '@master/css-language-service', '@master/css-runtime', '@master/css-cli']],
    ['@master/css-integration', ['@master/css-compiler', '@master/css-project', '@master/css-scanner', '@master/css-runtime', '@master/css-server', '@master/css.vite', '@master/css.webpack', '@master/css.next', '@master/css.astro', '@master/css.nuxt', '@master/css.vue', '@master/css.svelte', '@master/css.react']]
])

export const focusedSourceImportBoundaries = [
    {
        name: 'runtime source stays free of build-time and tooling packages',
        packageDir: 'runtime',
        forbiddenWorkspaceImports: [
            '@master/css-compiler',
            '@master/css-integration',
            '@master/css-project',
            '@master/css-scanner',
            '@master/css-server',
            '@master/css-source',
            '@master/css-stylesheet',
            '@master/css-language',
            '@master/css-language-service',
            '@master/css-language-server',
            '@master/css-lint',
            '@master/eslint-plugin-css',
            '@master/css-cli'
        ]
    },
    {
        name: 'stylesheet source does not import scanner state',
        packageDir: 'stylesheet',
        forbiddenWorkspaceImports: ['@master/css-scanner']
    }
]

export const browserSafeIntegrationEntryFiles = [
    'src/index.ts',
    'src/module.ts',
    'src/manifest-module.ts',
    'src/manifest-facade.ts',
    'src/style-module.ts',
    'src/emitted-globals-module.ts'
]
