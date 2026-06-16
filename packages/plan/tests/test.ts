import { expect, test } from 'vitest'
import { loadPlan, loadPlanModule, loadProjectPlan } from '../src/load'
import { loadPlanModuleSync, loadPlanSync, loadProjectPlanSync } from '../src/load-sync'
import { MASTER_CSS_PLAN_QUERY } from '@master/css-integration/plan-module'
import {
    findCSSPlanEntryFiles,
    findMasterCSSWorkspaceDirectories,
    hasMasterCSSPlanEntrypoint,
    resolveMasterCSSPackageEntryFile
} from '../src/css'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

function createFixture() {
    return mkdtempSync(join(tmpdir(), 'master-css-planer-'))
}

function writeCSSFixture(cwd: string) {
    mkdirSync(join(cwd, 'styles'), { recursive: true })
    const entry = join(cwd, 'index.css')
    const tokens = join(cwd, 'styles/tokens.css')
    writeFileSync(tokens, `
        @theme {
            --color-primary: #123;
        }
    `)
    writeFileSync(entry, `
        @master;
        @import './styles/tokens.css';

        @components {
            btn {
                color: var(--color-primary);
                display: inline-flex;
            }
        }
    `)
    return { entry, tokens }
}

test('loads CSS plan resources', async () => {
    const cwd = createFixture()
    try {
        const { entry, tokens } = writeCSSFixture(cwd)

        const result = await loadPlan(entry)
        expect(result).toMatchObject({
            dependencies: [
                entry,
                tokens
            ],
            nativeClassNames: [],
            nativeCSS: '',
            css: '',
            generatedCSS: ''
        })
        expect(result.plan.version).toBe(1)
        expect(result.plan.variables).toContainEqual(expect.objectContaining({
            name: 'color-primary',
            namespace: 'color',
            key: 'primary',
            value: '#123'
        }))
        expect(result.plan.utilities).toContainEqual(expect.objectContaining({
            name: 'btn',
            layer: 'components',
        }))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('loads CSS plan resources synchronously', () => {
    const cwd = createFixture()
    try {
        const { entry, tokens } = writeCSSFixture(cwd)

        const result = loadPlanSync(entry)
        expect(result).toMatchObject({
            dependencies: [
                entry,
                tokens
            ]
        })
        expect(result.plan.version).toBe(1)
        expect(result.plan.variables).toContainEqual(expect.objectContaining({
            name: 'color-primary',
            namespace: 'color',
            key: 'primary',
            value: '#123'
        }))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('loads package entry preset plan from CSS imports', async () => {
    const cwd = createFixture()
    try {
        const entry = join(cwd, 'index.css')
        writeFileSync(entry, `
            @import "@master/css";

            @components {
                card {
                    @variant @sm {
                        color: red;
                    }
                }
            }
        `)

        const result = await loadPlan(entry)
        const packageEntry = resolveMasterCSSPackageEntryFile('@master/css', entry, cwd)
        expect(packageEntry).toBeTruthy()
        if (!packageEntry) throw new Error('Expected Master CSS package entry')
        expect(result.dependencies).toContain(packageEntry)
        const packageDependencies = result.dependencies
            .filter((dependency) => !dependency.startsWith(cwd))
        expect(packageDependencies.length).toBeGreaterThan(1)
        expect(result.plan.variables).toContainEqual(expect.objectContaining({
            name: 'breakpoint-sm',
            namespace: 'breakpoint',
            key: 'sm',
            type: 'number',
            value: '52.125rem',
            numeric: { value: 52.125, unit: 'rem' }
        }))
        expect(result.plan.breakpointAtRules?.sm).toMatchObject({
            id: 'media',
            nodes: [expect.objectContaining({ type: 'number', value: 52.125, unit: 'rem' })]
        })
        expect(result.plan.utilities).toContainEqual(expect.objectContaining({
            name: 'card',
        }))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('loads project-level CSS plan entries', async () => {
    const cwd = createFixture()
    try {
        const { entry } = writeCSSFixture(cwd)
        writeFileSync(join(cwd, 'ignored.css'), `
            @preserve native;
            @layer components {
                .ignored {
                    color: red;
                }
            }
        `)

        expect(hasMasterCSSPlanEntrypoint('@master;')).toBe(true)
        expect(hasMasterCSSPlanEntrypoint('@preserve native;')).toBe(false)
        expect(hasMasterCSSPlanEntrypoint('@import "@master/css/index.css";')).toBe(false)
        await expect(findCSSPlanEntryFiles(cwd)).resolves.toStrictEqual([entry])

        const result = await loadProjectPlan(cwd)
        const syncResult = loadProjectPlanSync(cwd)

        expect(result.entries).toStrictEqual([entry])
        expect(syncResult.plan).toStrictEqual(result.plan)
        expect(result.plan.utilities).toContainEqual(expect.objectContaining({
            name: 'btn'
        }))
        expect(result.plan.utilities).not.toContainEqual(expect.objectContaining({
            name: 'ignored'
        }))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('finds Master CSS workspace directories from package and CSS entries', async () => {
    const cwd = createFixture()
    try {
        mkdirSync(join(cwd, 'packages/app'), { recursive: true })
        mkdirSync(join(cwd, 'docs/styles'), { recursive: true })
        writeFileSync(join(cwd, 'packages/app/package.json'), JSON.stringify({
            dependencies: {
                '@master/css': 'workspace:*'
            }
        }))
        writeFileSync(join(cwd, 'packages/app/index.css'), '@master;')
        writeFileSync(join(cwd, 'docs/styles/global.css'), '@import "@master/css";')

        await expect(findMasterCSSWorkspaceDirectories(cwd)).resolves.toStrictEqual([
            cwd,
            join(cwd, 'docs/styles'),
            join(cwd, 'packages/app')
        ])
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('turns CSS plan results into JavaScript modules', async () => {
    const cwd = createFixture()
    try {
        const { entry } = writeCSSFixture(cwd)
        const result = await loadPlanModule(entry)
        const syncResult = loadPlanModuleSync(entry + MASTER_CSS_PLAN_QUERY)

        expect(result.code).toContain('export default')
        expect(result.code).toContain('"version":1')
        expect(syncResult.code).toBe(result.code)
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('rejects script config paths', async () => {
    const cwd = createFixture()
    try {
        const script = join(cwd, 'config.ts')
        writeFileSync(script, 'export default {}')

        await expect(loadPlan(script)).rejects.toThrow('CSS files')
        expect(() => loadPlanSync(script)).toThrow('CSS files')
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})
