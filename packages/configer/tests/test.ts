import { expect, test } from 'vitest'
import { loadConfig, loadConfigModule, loadProjectConfig } from '../src/load'
import { loadConfigModuleSync, loadConfigSync, loadProjectConfigSync } from '../src/load-sync'
import { MASTER_CSS_CONFIG_QUERY } from '@master/css-integration/config-module'
import {
    findCSSConfigEntryFiles,
    findMasterCSSWorkspaceDirectories,
    hasMasterCSSConfigEntrypoint,
    resolveMasterCSSPackageEntryFile
} from '../src/css'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

function createFixture() {
    return mkdtempSync(join(tmpdir(), 'master-css-configer-'))
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

        @layer components {
            .btn {
                color: var(--color-primary);
                display: inline-flex;
            }
        }
    `)
    return { entry, tokens }
}

test('loads CSS config resources', async () => {
    const cwd = createFixture()
    try {
        const { entry, tokens } = writeCSSFixture(cwd)

        await expect(loadConfig(entry)).resolves.toMatchObject({
            dependencies: [
                entry,
                tokens
            ],
            nativeClassNames: [],
            nativeCSS: '',
            css: '',
            generatedCSS: '',
            config: {
                variables: [
                    {
                        namespace: 'color',
                        key: 'primary',
                        value: '#123'
                    }
                ],
                utilities: [
                    {
                        name: 'btn',
                        type: -4,
                        layer: 'components',
                        unit: '',
                        separators: [
                            ','
                        ],
                        declarations: {
                            color: 'var(--color-primary)',
                            display: 'inline-flex'
                        }
                    }
                ]
            }
        })
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('loads CSS config resources synchronously', () => {
    const cwd = createFixture()
    try {
        const { entry, tokens } = writeCSSFixture(cwd)

        expect(loadConfigSync(entry)).toMatchObject({
            dependencies: [
                entry,
                tokens
            ],
            config: {
                variables: [
                    {
                        namespace: 'color',
                        key: 'primary',
                        value: '#123'
                    }
                ]
            }
        })
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('loads package entry theme config from CSS imports', async () => {
    const cwd = createFixture()
    try {
        const entry = join(cwd, 'index.css')
        writeFileSync(entry, `
            @import "@master/css";

            @layer components {
                .card {
                    @at sm {
                        color: red;
                    }
                }
            }
        `)

        const result = await loadConfig(entry)
        const packageEntry = resolveMasterCSSPackageEntryFile('@master/css', entry, cwd)
        expect(packageEntry).toBeTruthy()
        expect(result.dependencies).toContain(packageEntry)
        const packageDependencies = result.dependencies
            .filter((dependency) => dependency.startsWith(dirname(packageEntry!)))
        expect(packageDependencies.length).toBeGreaterThan(1)
        expect(result.config.variables).toContainEqual({
            namespace: 'screen',
            key: 'sm',
            value: 834
        })
        expect(result.config.utilities).toContainEqual(expect.objectContaining({
            name: 'card',
            rules: [
                expect.objectContaining({
                    atRules: [expect.stringContaining('width>=')]
                })
            ]
        }))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('loads project-level CSS config entries', async () => {
    const cwd = createFixture()
    try {
        const { entry } = writeCSSFixture(cwd)
        writeFileSync(join(cwd, 'ignored.css'), `
            @master shake;
            @layer components {
                .ignored {
                    color: red;
                }
            }
        `)

        expect(hasMasterCSSConfigEntrypoint('@master;')).toBe(true)
        expect(hasMasterCSSConfigEntrypoint('@master shake;')).toBe(false)
        expect(hasMasterCSSConfigEntrypoint('@import "@master/css/index.css";')).toBe(false)
        await expect(findCSSConfigEntryFiles(cwd)).resolves.toStrictEqual([entry])

        const result = await loadProjectConfig(cwd)
        const syncResult = loadProjectConfigSync(cwd)

        expect(result.entries).toStrictEqual([entry])
        expect(syncResult.config).toStrictEqual(result.config)
        expect(result.config.utilities).toContainEqual(expect.objectContaining({
            name: 'btn'
        }))
        expect(result.config.utilities).not.toContainEqual(expect.objectContaining({
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

test('turns CSS config results into JavaScript modules', async () => {
    const cwd = createFixture()
    try {
        const { entry } = writeCSSFixture(cwd)
        const result = await loadConfigModule(entry)
        const syncResult = loadConfigModuleSync(entry + MASTER_CSS_CONFIG_QUERY)

        expect(result.code).toContain('export default')
        expect(result.code).toContain('"namespace":"color"')
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

        await expect(loadConfig(script)).rejects.toThrow('CSS files')
        expect(() => loadConfigSync(script)).toThrow('CSS files')
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})
