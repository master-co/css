import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import { applySetup, createSetupPlan } from '../src'
import { resolveCommandOptions } from '../src/core'
import { addMasterCSSEslintConfig } from '../src/transforms'

const cliFilepath = resolve(__dirname, '../src/bin/index.ts')
const tsconfigPath = resolve(__dirname, '../../../tsconfig.json')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

function createTempProject(name: string, packageJSON: Record<string, unknown> = {}) {
    const root = mkdtempSync(join(tmpdir(), name))
    writeFileSync(join(root, 'package.json'), JSON.stringify({
        name,
        type: 'module',
        dependencies: {},
        devDependencies: {},
        ...packageJSON
    }, null, 4), 'utf8')
    return root
}

function readProjectFile(root: string, file: string) {
    return readFileSync(join(root, file), 'utf8')
}

function writeProjectFile(root: string, file: string, content: string) {
    const filePath = join(root, file)
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, content, 'utf8')
}

function runCLI(args: string[], options: { cwd?: string, env?: NodeJS.ProcessEnv } = {}) {
    return spawnSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, ...args], {
        cwd: options.cwd,
        encoding: 'utf8',
        env: {
            ...process.env,
            ...(options.env || {}),
            TSX_TSCONFIG_PATH: tsconfigPath
        }
    })
}

function createFakePackageManager(name: string) {
    const root = mkdtempSync(join(tmpdir(), 'master-css-create-pm-'))
    const marker = join(root, 'install.log')
    const binary = join(root, name)
    const windowsBinary = join(root, `${name}.cmd`)
    const shim = join(root, `${name}.cjs`)
    const envKey = pathEnvKey()
    writeFileSync(shim, `const { realpathSync, writeFileSync } = require('node:fs')
writeFileSync(${JSON.stringify(marker)}, \`\${realpathSync(process.cwd())} \${process.argv.slice(2).join(' ')}\`)
`, 'utf8')
    writeFileSync(binary, `#!/bin/sh
exec ${JSON.stringify(process.execPath)} ${JSON.stringify(shim)} "$@"
`, 'utf8')
    writeFileSync(windowsBinary, `@echo off\r\n"${process.execPath}" "${shim}" %*\r\n`, 'utf8')
    chmodSync(binary, 0o755)
    return {
        root,
        marker,
        env: {
            [envKey]: `${root}${delimiter}${process.env[envKey] || ''}`
        }
    }
}

function pathEnvKey() {
    if (process.platform !== 'win32') return 'PATH'
    return Object.keys(process.env).find((key) => key.toLowerCase() === 'path') || 'Path'
}

describe('@master/create-css setup planner', () => {
    test('creates a modern ESLint flat config', () => {
        expect(addMasterCSSEslintConfig('')).toBe(`import { defineConfig } from 'eslint/config'
import css from '@master/eslint-config-css'

export default defineConfig([
    ...css
])
`)
    })

    test('adds Master CSS to an existing defineConfig flat config', () => {
        expect(addMasterCSSEslintConfig(`import { defineConfig } from 'eslint/config'
import js from '@eslint/js'

export default defineConfig([
    js.configs.recommended
])
`)).toBe(`import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import css from '@master/eslint-config-css'

export default defineConfig([
    ...css,
    js.configs.recommended
])
`)
    })

    test('wraps legacy flat arrays in defineConfig', () => {
        expect(addMasterCSSEslintConfig(`import js from '@eslint/js'

export default [
    js.configs.recommended
]
`)).toBe(`import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import css from '@master/eslint-config-css'

export default defineConfig([
    ...css,
    js.configs.recommended
])
`)
    })

    test('keeps existing Master CSS ESLint config unchanged', () => {
        const content = `import { defineConfig } from 'eslint/config'
import css from '@master/eslint-config-css'

export default defineConfig([
    ...css
])
`

        expect(addMasterCSSEslintConfig(content)).toBe(content)
    })

    test('plans a Vite project add with recommended integrations by default', () => {
        const root = createTempProject('master-css-create-vite-', {
            dependencies: {
                vite: '^8.0.0'
            }
        })

        const plan = createSetupPlan({
            root,
            framework: 'auto'
        })

        expect(plan.framework).toBe('vite')
        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite',
            '@master/eslint-config-css',
            'eslint',
            '@master/css-mcp'
        ])
        expect(plan.files.map((file) => [file.path, file.action])).toEqual([
            ['vite.config.js', 'create'],
            ['src/style.css', 'create'],
            ['eslint.config.js', 'create'],
            ['AGENTS.md', 'create']
        ])
        expect(plan.commands[0].command).toContain('@master/css-mcp@rc')
    })

    test('plans minimal Vite setup without recommended integrations', () => {
        const root = createTempProject('master-css-create-vite-minimal-', {
            dependencies: {
                vite: '^8.0.0'
            }
        })

        const plan = createSetupPlan({
            root,
            minimal: true
        })

        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite'
        ])
        expect(plan.files.map((file) => file.path)).toEqual([
            'vite.config.js',
            'src/style.css'
        ])
        expect(plan.commands).toEqual([])
    })

    test('allows explicit recommended integrations to override minimal mode', () => {
        const root = createTempProject('master-css-create-vite-minimal-eslint-', {
            dependencies: {
                vite: '^8.0.0'
            }
        })

        const plan = createSetupPlan({
            root,
            minimal: true,
            eslint: true
        })

        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite',
            '@master/eslint-config-css',
            'eslint'
        ])
        expect(plan.files.map((file) => file.path)).toEqual([
            'vite.config.js',
            'src/style.css',
            'eslint.config.js'
        ])
        expect(plan.commands).toEqual([])
    })

    test('honors explicit recommended integration opt-outs', () => {
        const root = createTempProject('master-css-create-vite-no-recommended-', {
            dependencies: {
                vite: '^8.0.0'
            }
        })

        const plan = createSetupPlan({
            root,
            eslint: false,
            mcp: false,
            ai: false
        })

        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite'
        ])
        expect(plan.files.map((file) => file.path)).toEqual([
            'vite.config.js',
            'src/style.css'
        ])
        expect(plan.commands).toEqual([])
    })

    test('resolves interactive prompt defaults to recommended options', async () => {
        const questions: string[] = []
        const resolved = await resolveCommandOptions({}, async (question) => {
            questions.push(question)
            return ''
        })

        expect(resolved).toEqual({
            eslint: true,
            mcp: true,
            ai: true,
            install: 'detected'
        })
        expect(questions).toHaveLength(4)
    })

    test('resolves interactive no answers for recommended options', async () => {
        const answers = ['n', 'no', 'N', 'No']
        const resolved = await resolveCommandOptions({}, async () => answers.shift() || '')

        expect(resolved).toEqual({
            eslint: false,
            mcp: false,
            ai: false,
            install: false
        })
    })

    test('prints new project guidance instead of writing files outside a project', () => {
        const root = mkdtempSync(join(tmpdir(), 'master-css-create-empty-'))
        try {
            const result = runCLI(['--cwd', root])

            expect(result.status).toBe(0)
            expect(result.stdout).toContain('No package.json was found')
            expect(result.stdout).toContain('npm create vite@latest my-app')
            expect(result.stdout).toContain('cd my-app')
            expect(result.stdout).toContain('npm create @master/css@rc -- --yes')
            expect(existsSync(join(root, 'src/master.css'))).toBe(false)
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    test('rejects positional project scaffolding with Vite guidance', () => {
        const result = runCLI(['my-app'])

        expect(result.status).toBe(1)
        expect(result.stderr).toContain('Project scaffolding is not provided by @master/create-css')
        expect(result.stderr).toContain('npm create vite@latest my-app')
        expect(result.stderr).toContain('npm create @master/css@rc -- --yes')
    })

    test('prints an auto-detected Vite plan without explicit framework', () => {
        const root = createTempProject('master-css-create-cli-vite-', {
            dependencies: {
                vite: '^8.0.0'
            }
        })

        const result = runCLI(['--cwd', root, '--json'])
        const plan = JSON.parse(result.stdout)

        expect(result.status).toBe(0)
        expect(plan.framework).toBe('vite')
        expect(plan.files.map((file: { path: string }) => file.path)).toEqual([
            'vite.config.js',
            'src/style.css',
            'eslint.config.js',
            'AGENTS.md'
        ])
        expect(existsSync(join(root, 'vite.config.js'))).toBe(false)
    })

    test('prints a minimal JSON plan from the CLI without recommended integrations', () => {
        const root = createTempProject('master-css-create-cli-minimal-', {
            dependencies: {
                vite: '^8.0.0'
            }
        })

        const result = runCLI(['--cwd', root, '--json', '--minimal'])
        const plan = JSON.parse(result.stdout)

        expect(result.status).toBe(0)
        expect(plan.dependencies.map((dependency: { name: string }) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite'
        ])
        expect(plan.files.map((file: { path: string }) => file.path)).toEqual([
            'vite.config.js',
            'src/style.css'
        ])
        expect(plan.commands).toEqual([])
    })

    test('re-enables explicit recommended integrations from the CLI minimal mode', () => {
        const root = createTempProject('master-css-create-cli-minimal-eslint-', {
            dependencies: {
                vite: '^8.0.0'
            }
        })

        const result = runCLI(['--cwd', root, '--json', '--minimal', '--eslint'])
        const plan = JSON.parse(result.stdout)

        expect(result.status).toBe(0)
        expect(plan.dependencies.map((dependency: { name: string }) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite',
            '@master/eslint-config-css',
            'eslint'
        ])
        expect(plan.files.map((file: { path: string }) => file.path)).toEqual([
            'vite.config.js',
            'src/style.css',
            'eslint.config.js'
        ])
        expect(plan.commands).toEqual([])
    })

    test('honors CLI opt-outs for recommended integrations', () => {
        const root = createTempProject('master-css-create-cli-no-recommended-', {
            dependencies: {
                vite: '^8.0.0'
            }
        })

        const result = runCLI(['--cwd', root, '--json', '--no-eslint', '--no-mcp', '--no-ai'])
        const plan = JSON.parse(result.stdout)

        expect(result.status).toBe(0)
        expect(plan.dependencies.map((dependency: { name: string }) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite'
        ])
        expect(plan.files.map((file: { path: string }) => file.path)).toEqual([
            'vite.config.js',
            'src/style.css'
        ])
        expect(plan.commands).toEqual([])
    })

    test('runs detected package manager install with --yes', () => {
        const root = createTempProject('master-css-create-cli-yes-install-', {
            packageManager: 'npm@12.0.0',
            dependencies: {
                vite: '^8.0.0'
            }
        })
        const fakePackageManager = createFakePackageManager('npm')

        try {
            const result = runCLI(['--cwd', root, '--yes'], {
                env: fakePackageManager.env
            })

            expect(result.status).toBe(0)
            expect(readFileSync(fakePackageManager.marker, 'utf8')).toBe(`${realpathSync(root)} install`)
        } finally {
            rmSync(fakePackageManager.root, { recursive: true, force: true })
        }
    })

    test('skips detected package manager install with --yes --no-install', () => {
        const root = createTempProject('master-css-create-cli-yes-no-install-', {
            packageManager: 'npm@12.0.0',
            dependencies: {
                vite: '^8.0.0'
            }
        })
        const fakePackageManager = createFakePackageManager('npm')

        try {
            const result = runCLI(['--cwd', root, '--yes', '--no-install'], {
                env: fakePackageManager.env
            })

            expect(result.status).toBe(0)
            expect(existsSync(fakePackageManager.marker)).toBe(false)
        } finally {
            rmSync(fakePackageManager.root, { recursive: true, force: true })
        }
    })

    test('applies idempotent Vite and ESLint setup', () => {
        const root = createTempProject('master-css-create-apply-', {
            packageManager: 'pnpm@11.9.0',
            dependencies: {
                vite: '^8.0.0'
            }
        })

        applySetup({
            root,
            eslint: true,
            install: false
        })
        const once = {
            packageJSON: readProjectFile(root, 'package.json'),
            vite: readProjectFile(root, 'vite.config.js'),
            css: readProjectFile(root, 'src/style.css'),
            eslint: readProjectFile(root, 'eslint.config.js'),
            agents: readProjectFile(root, 'AGENTS.md')
        }

        applySetup({
            root,
            eslint: true,
            install: false
        })
        expect({
            packageJSON: readProjectFile(root, 'package.json'),
            vite: readProjectFile(root, 'vite.config.js'),
            css: readProjectFile(root, 'src/style.css'),
            eslint: readProjectFile(root, 'eslint.config.js'),
            agents: readProjectFile(root, 'AGENTS.md')
        }).toEqual(once)
    })

    test('plans React projects with the Vite plugin and index CSS entry', () => {
        const root = createTempProject('master-css-create-react-', {
            dependencies: {
                '@vitejs/plugin-react': '^6.0.0',
                react: '^19.0.0',
                vite: '^8.0.0'
            }
        })
        writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'

export default defineConfig({
    plugins: []
})
`)
        writeProjectFile(root, 'src/index.css', 'body { margin: 0; }\n')

        const plan = createSetupPlan({ root })

        expect(plan.framework).toBe('react')
        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite',
            '@master/eslint-config-css',
            'eslint',
            '@master/css-mcp'
        ])
        expect(plan.files.map((file) => [file.path, file.action])).toEqual([
            ['vite.config.ts', 'update'],
            ['src/index.css', 'update'],
            ['eslint.config.js', 'create'],
            ['AGENTS.md', 'create']
        ])
    })

    test('prints an auto-detected React Vite plan without explicit framework', () => {
        const root = createTempProject('master-css-create-cli-react-', {
            dependencies: {
                '@vitejs/plugin-react': '^6.0.0',
                react: '^19.0.0',
                vite: '^8.0.0'
            }
        })

        const result = runCLI(['--cwd', root, '--json'])
        const plan = JSON.parse(result.stdout)

        expect(result.status).toBe(0)
        expect(plan.framework).toBe('react')
        expect(plan.files.map((file: { path: string }) => file.path)).toEqual([
            'vite.config.js',
            'src/index.css',
            'eslint.config.js',
            'AGENTS.md'
        ])
        expect(existsSync(join(root, 'vite.config.js'))).toBe(false)
    })

    test('plans Vue projects with the Vite plugin and assets CSS entry', () => {
        const root = createTempProject('master-css-create-vue-', {
            dependencies: {
                '@vitejs/plugin-vue': '^7.0.0',
                vue: '^3.5.0',
                vite: '^8.0.0'
            }
        })
        writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [
        vue()
    ]
})
`)
        writeProjectFile(root, 'src/assets/main.css', 'body { margin: 0; }\n')
        writeProjectFile(root, 'src/App.vue', '<template><h1 class="block">Hello</h1></template>\n')

        const plan = createSetupPlan({ root })

        expect(plan.framework).toBe('vue')
        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite',
            '@master/eslint-config-css',
            'eslint',
            '@master/css-mcp'
        ])
        expect(plan.files.map((file) => [file.path, file.action])).toEqual([
            ['vite.config.ts', 'update'],
            ['src/assets/main.css', 'update'],
            ['eslint.config.js', 'create'],
            ['AGENTS.md', 'create']
        ])

        applySetup({ root, install: false })

        expect(readProjectFile(root, 'vite.config.ts')).toContain("import masterCSS from '@master/css.vite'")
        expect(readProjectFile(root, 'vite.config.ts')).toContain('masterCSS()')
        expect(readProjectFile(root, 'src/assets/main.css')).toContain("@import '@master/css';")
    })

    test('honors explicit Vue setup without framework auto detection', () => {
        const root = createTempProject('master-css-create-vue-explicit-')

        const plan = createSetupPlan({
            root,
            framework: 'vue',
            minimal: true
        })

        expect(plan.framework).toBe('vue')
        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite'
        ])
        expect(plan.files.map((file) => [file.path, file.action])).toEqual([
            ['vite.config.ts', 'create'],
            ['src/assets/main.css', 'create']
        ])
    })

    test('plans React Router framework projects before generic React', () => {
        const root = createTempProject('master-css-create-react-router-', {
            dependencies: {
                '@react-router/dev': '^8.0.0',
                react: '^19.0.0',
                'react-dom': '^19.0.0',
                vite: '^8.0.0'
            }
        })
        writeProjectFile(root, 'react-router.config.ts', 'export default {}\n')
        writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'

export default defineConfig({
    plugins: []
})
`)
        writeProjectFile(root, 'app/root.tsx', `import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

export function Layout({ children }: { children: React.ReactNode }) {
    return <html><body>{children}</body></html>
}

export default function App() {
    return <Outlet />
}
`)

        const plan = createSetupPlan({ root })

        expect(plan.framework).toBe('react-router')
        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.vite',
            '@master/eslint-config-css',
            'eslint',
            '@master/css-mcp'
        ])
        expect(plan.files.map((file) => [file.path, file.action])).toEqual([
            ['vite.config.ts', 'update'],
            ['app/app.css', 'create'],
            ['app/root.tsx', 'update'],
            ['eslint.config.js', 'create'],
            ['AGENTS.md', 'create']
        ])

        applySetup({ root, install: false })

        expect(readProjectFile(root, 'vite.config.ts')).toContain("import masterCSS from '@master/css.vite'")
        expect(readProjectFile(root, 'app/app.css')).toBe("@import '@master/css';\n")
        expect(readProjectFile(root, 'app/root.tsx')).toContain("import './app.css'")
    })

    test('applies idempotent React Router root CSS imports', () => {
        const root = createTempProject('master-css-create-react-router-idempotent-', {
            dependencies: {
                '@react-router/dev': '^8.0.0',
                react: '^19.0.0',
                vite: '^8.0.0'
            }
        })
        writeProjectFile(root, 'react-router.config.ts', 'export default {}\n')
        writeProjectFile(root, 'app/root.tsx', `import { Outlet } from 'react-router'

export default function App() {
    return <Outlet />
}
`)

        applySetup({ root, install: false })
        const once = {
            root: readProjectFile(root, 'app/root.tsx'),
            css: readProjectFile(root, 'app/app.css'),
            vite: readProjectFile(root, 'vite.config.ts')
        }

        applySetup({ root, install: false })

        expect({
            root: readProjectFile(root, 'app/root.tsx'),
            css: readProjectFile(root, 'app/app.css'),
            vite: readProjectFile(root, 'vite.config.ts')
        }).toEqual(once)
    })

    test('plans Rspack projects with the Webpack-compatible plugin before generic React', () => {
        const root = createTempProject('master-css-create-rspack-', {
            dependencies: {
                '@rspack/core': '^2.0.0',
                '@rspack/cli': '^2.0.0',
                react: '^19.0.0'
            }
        })
        writeProjectFile(root, 'rspack.config.mjs', `export default {
    plugins: []
}
`)
        writeProjectFile(root, 'src/index.css', 'body { margin: 0; }\n')

        const plan = createSetupPlan({ root })

        expect(plan.framework).toBe('rspack')
        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.webpack',
            '@master/eslint-config-css',
            'eslint',
            '@master/css-mcp'
        ])
        expect(plan.dependencies.map((dependency) => dependency.name)).not.toContain('webpack')
        expect(plan.files.map((file) => [file.path, file.action])).toEqual([
            ['rspack.config.mjs', 'update'],
            ['src/index.css', 'update'],
            ['eslint.config.js', 'create'],
            ['AGENTS.md', 'create']
        ])

        applySetup({ root, install: false })

        expect(readProjectFile(root, 'rspack.config.mjs')).toContain("import MasterCSSPlugin from '@master/css.webpack'")
        expect(readProjectFile(root, 'rspack.config.mjs')).toContain('new MasterCSSPlugin()')
        expect(readProjectFile(root, 'src/index.css')).toContain("@import '@master/css';")
    })

    test('applies idempotent explicit Rspack setup with fallback config', () => {
        const root = createTempProject('master-css-create-rspack-explicit-')

        applySetup({
            root,
            framework: 'rspack',
            minimal: true,
            install: false
        })
        const once = {
            config: readProjectFile(root, 'rspack.config.mjs'),
            css: readProjectFile(root, 'src/index.css'),
            packageJSON: readProjectFile(root, 'package.json')
        }

        applySetup({
            root,
            framework: 'rspack',
            minimal: true,
            install: false
        })

        expect({
            config: readProjectFile(root, 'rspack.config.mjs'),
            css: readProjectFile(root, 'src/index.css'),
            packageJSON: readProjectFile(root, 'package.json')
        }).toEqual(once)
        expect(once.config).toContain("type: 'css/auto'")
    })

    test('plans Rsbuild projects with tools.rspack before generic Vue', () => {
        const root = createTempProject('master-css-create-rsbuild-', {
            dependencies: {
                '@rsbuild/core': '^2.0.0',
                vue: '^3.5.0'
            }
        })
        writeProjectFile(root, 'rsbuild.config.ts', `import { defineConfig } from '@rsbuild/core'

export default defineConfig({
    plugins: []
})
`)

        const plan = createSetupPlan({ root })

        expect(plan.framework).toBe('rsbuild')
        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css.webpack',
            '@master/eslint-config-css',
            'eslint',
            '@master/css-mcp'
        ])
        expect(plan.dependencies.map((dependency) => dependency.name)).not.toContain('webpack')
        expect(plan.files.map((file) => [file.path, file.action])).toEqual([
            ['rsbuild.config.ts', 'update'],
            ['src/index.css', 'create'],
            ['eslint.config.js', 'create'],
            ['AGENTS.md', 'create']
        ])

        applySetup({ root, install: false })

        expect(readProjectFile(root, 'rsbuild.config.ts')).toContain("import MasterCSSPlugin from '@master/css.webpack'")
        expect(readProjectFile(root, 'rsbuild.config.ts')).toContain('tools: {')
        expect(readProjectFile(root, 'rsbuild.config.ts')).toContain('rspack(config)')
        expect(readProjectFile(root, 'rsbuild.config.ts')).toContain('config.plugins.push(new MasterCSSPlugin())')
        expect(readProjectFile(root, 'src/index.css')).toBe("@import '@master/css';\n")
    })

    test('applies idempotent explicit Rsbuild setup with fallback config', () => {
        const root = createTempProject('master-css-create-rsbuild-explicit-')

        applySetup({
            root,
            framework: 'rsbuild',
            minimal: true,
            install: false
        })
        const once = {
            config: readProjectFile(root, 'rsbuild.config.ts'),
            css: readProjectFile(root, 'src/index.css'),
            packageJSON: readProjectFile(root, 'package.json')
        }

        applySetup({
            root,
            framework: 'rsbuild',
            minimal: true,
            install: false
        })

        expect({
            config: readProjectFile(root, 'rsbuild.config.ts'),
            css: readProjectFile(root, 'src/index.css'),
            packageJSON: readProjectFile(root, 'package.json')
        }).toEqual(once)
        expect(once.config).toContain("import { defineConfig } from '@rsbuild/core'")
    })

    test('plans Laravel projects with the Vite plugin in static mode', () => {
        const root = createTempProject('master-css-create-laravel-', {
            dependencies: {
                'laravel-vite-plugin': '^3.0.0',
                vite: '^8.0.0'
            }
        })
        writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css']
        })
    ]
})
`)

        applySetup({ root, install: false })

        expect(readProjectFile(root, 'vite.config.ts')).toContain("masterCSS({ mode: 'static' })")
        expect(readProjectFile(root, 'resources/css/app.css')).toBe("@import '@master/css';\n")
    })

    test('plans Lit projects with runtime client types and shadow-root setup', () => {
        const root = createTempProject('master-css-create-lit-', {
            dependencies: {
                lit: '^3.0.0',
                vite: '^8.0.0'
            }
        })
        writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'

export default defineConfig({})
`)
        writeProjectFile(root, 'src/my-element.ts', `import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('my-element')
export class MyElement extends LitElement {
    render() {
        return html\`<h1>Hello</h1>\`
    }
}
`)

        applySetup({ root, install: false })

        expect(readProjectFile(root, 'src/vite-env.d.ts')).toContain('@master/css-integration/client')
        expect(readProjectFile(root, 'src/my-element.ts')).toContain('@cssRuntime({ manifest, emittedGlobals })')
        expect(readProjectFile(root, 'src/my-element.ts')).toContain('cssRuntime?: CSSRuntime')
    })

    test('plans Angular projects with runtime setup', () => {
        const root = createTempProject('master-css-create-angular-', {
            dependencies: {
                '@angular/core': '^22.0.0'
            }
        })
        writeProjectFile(root, 'angular.json', '{}\n')
        writeProjectFile(root, 'src/main.ts', `import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'

bootstrapApplication(AppComponent)
`)

        const plan = createSetupPlan({ root })

        expect(plan.framework).toBe('angular')
        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/css',
            '@master/css-runtime',
            '@master/css-preset',
            '@master/eslint-config-css',
            'eslint',
            '@master/css-mcp'
        ])

        applySetup({ root, install: false })

        expect(readProjectFile(root, 'src/main.ts')).toContain("import CSSRuntime from '@master/css-runtime'")
        expect(readProjectFile(root, 'src/main.ts')).toContain('CSSRuntime.create({ manifest: defaultManifest }).observe()')
        expect(readProjectFile(root, 'src/styles.css')).toBe("@import '@master/css';\n")
    })

    test('updates existing Next.js config wrappers', () => {
        const root = createTempProject('master-css-create-next-', {
            dependencies: {
                next: '^16.0.0'
            }
        })
        writeProjectFile(root, 'next.config.mjs', `const nextConfig = {
    reactStrictMode: true
}

export default nextConfig;
`)

        applySetup({ root, install: false })

        expect(readProjectFile(root, 'next.config.mjs')).toContain("import { withMasterCSS } from '@master/css.next'")
        expect(readProjectFile(root, 'next.config.mjs')).toContain('export default withMasterCSS(nextConfig);')
    })

    test('delegates SvelteKit setup to @master/css-sv', () => {
        const root = createTempProject('master-css-create-svelte-', {
            dependencies: {
                '@sveltejs/kit': '^2.0.0'
            }
        })

        const plan = createSetupPlan({ root })

        expect(plan.framework).toBe('svelte')
        expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
            '@master/eslint-config-css',
            'eslint',
            '@master/css-mcp'
        ])
        expect(plan.files.map((file) => file.path)).toEqual([
            'eslint.config.js',
            'AGENTS.md'
        ])
        expect(plan.commands[0].command).toContain('sv add @master/css-sv')
        expect(plan.commands[1].command).toContain('@master/css-mcp@rc')
    })
})
