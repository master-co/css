import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { applySetup, createSetupPlan } from '../src'
import { addMasterCSSEslintConfig } from '../src/transforms'

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
