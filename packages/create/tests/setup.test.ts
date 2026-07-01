import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import { applySetup, createSetupPlan } from '../src'
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

function runCLI(args: string[], options: { cwd?: string } = {}) {
    return spawnSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, ...args], {
        cwd: options.cwd,
        encoding: 'utf8',
        env: {
            ...process.env,
            TSX_TSCONFIG_PATH: tsconfigPath
        }
    })
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

    test('plans a Vite project add with ESLint and MCP', () => {
        const root = createTempProject('master-css-create-vite-', {
            dependencies: {
                vite: '^8.0.0'
            }
        })

        const plan = createSetupPlan({
            root,
            framework: 'auto',
            eslint: true,
            mcp: true
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
            ['eslint.config.js', 'create']
        ])
        expect(plan.commands[0].command).toContain('@master/css-mcp@rc')
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
            'src/style.css'
        ])
        expect(existsSync(join(root, 'vite.config.js'))).toBe(false)
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
            eslint: readProjectFile(root, 'eslint.config.js')
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
            eslint: readProjectFile(root, 'eslint.config.js')
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
            '@master/css.vite'
        ])
        expect(plan.files.map((file) => [file.path, file.action])).toEqual([
            ['vite.config.ts', 'update'],
            ['src/index.css', 'update']
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
            'src/index.css'
        ])
        expect(existsSync(join(root, 'vite.config.js'))).toBe(false)
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
            '@master/css-preset'
        ])

        applySetup({ root, install: false })

        expect(readProjectFile(root, 'src/main.ts')).toContain("import { CSSRuntime } from '@master/css-runtime'")
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
        expect(plan.dependencies).toEqual([])
        expect(plan.files).toEqual([])
        expect(plan.commands[0].command).toContain('sv add @master/css-sv')
    })
})
