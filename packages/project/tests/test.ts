import { expect, test } from 'vitest'
import { loadManifest, loadManifestJSON, loadProjectManifest } from '../src/manifest'
import { loadManifestJSONSync, loadManifestSync, loadProjectManifestSync } from '../src/manifest-sync'
import { MASTER_CSS_MANIFEST_QUERY } from '@master/css-integration/manifest-module'
import {
    findCSSManifestEntryFiles,
    findMasterCSSWorkspaceDirectories,
    hasMasterCSSManifestEntrypoint,
    resolveMasterCSSPackageEntryFile
} from '../src/entries'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'

function createFixture() {
    return mkdtempSync(join(tmpdir(), 'master-css-manifester-'))
}

function isSameOrChildPath(parentPath: string, childPath: string) {
    const relativePath = relative(parentPath, childPath)
    return relativePath === ''
        || (
            !!relativePath
            && relativePath !== '..'
            && !relativePath.startsWith(`..${sep}`)
            && !isAbsolute(relativePath)
        )
}

function writeCSSFixture(cwd: string) {
    mkdirSync(join(cwd, 'styles'), { recursive: true })
    const entry = join(cwd, 'index.css')
    const tokens = join(cwd, 'styles', 'tokens.css')
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

test('loads CSS manifest resources', async () => {
    const cwd = createFixture()
    try {
        const { entry, tokens } = writeCSSFixture(cwd)

        const result = await loadManifest(entry)
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
        expect(result.manifest.version).toBe(1)
        expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
            name: 'color-primary',
            namespace: 'color',
            key: 'primary',
            value: '#123'
        }))
        expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
            name: 'btn',
            layer: 'components',
        }))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('loads CSS manifest resources synchronously', () => {
    const cwd = createFixture()
    try {
        const { entry, tokens } = writeCSSFixture(cwd)

        const result = loadManifestSync(entry)
        expect(result).toMatchObject({
            dependencies: [
                entry,
                tokens
            ]
        })
        expect(result.manifest.version).toBe(1)
        expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
            name: 'color-primary',
            namespace: 'color',
            key: 'primary',
            value: '#123'
        }))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('loads package entry preset manifest from CSS imports', async () => {
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

        const result = await loadManifest(entry)
        const packageEntry = resolveMasterCSSPackageEntryFile('@master/css', entry, cwd)
        expect(packageEntry).toBeTruthy()
        if (!packageEntry) throw new Error('Expected Master CSS package entry')
        expect(result.dependencies).toContain(packageEntry)
        const packageDependencies = result.dependencies
            .filter((dependency: string) => !isSameOrChildPath(cwd, dependency))
        expect(packageDependencies.length).toBeGreaterThan(1)
        expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
            name: 'breakpoint-sm',
            namespace: 'breakpoint',
            key: 'sm',
            type: 'number',
            value: '52.125rem',
            numeric: { value: 52.125, unit: 'rem' }
        }))
        expect(result.manifest.breakpointAtRules?.sm).toMatchObject({
            id: 'media',
            nodes: [expect.objectContaining({ type: 'number', value: 52.125, unit: 'rem' })]
        })
        expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
            name: 'card',
        }))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('loads project-level CSS manifest entries', async () => {
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

        expect(hasMasterCSSManifestEntrypoint('@master;')).toBe(true)
        expect(hasMasterCSSManifestEntrypoint('@preserve native;')).toBe(false)
        expect(hasMasterCSSManifestEntrypoint('@import "@master/css/index.css";')).toBe(false)
        await expect(findCSSManifestEntryFiles(cwd)).resolves.toStrictEqual([entry])

        const result = await loadProjectManifest(cwd)
        const syncResult = loadProjectManifestSync(cwd)

        expect(result.entries).toStrictEqual([entry])
        expect(syncResult.manifest).toStrictEqual(result.manifest)
        expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
            name: 'btn'
        }))
        expect(result.manifest.utilities).not.toContainEqual(expect.objectContaining({
            name: 'ignored'
        }))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('finds Master CSS workspace directories from package and CSS entries', async () => {
    const cwd = createFixture()
    try {
        mkdirSync(join(cwd, 'packages', 'app'), { recursive: true })
        mkdirSync(join(cwd, 'docs', 'styles'), { recursive: true })
        writeFileSync(join(cwd, 'packages', 'app', 'package.json'), JSON.stringify({
            dependencies: {
                '@master/css': 'workspace:*'
            }
        }))
        writeFileSync(join(cwd, 'packages', 'app', 'index.css'), '@master;')
        writeFileSync(join(cwd, 'docs', 'styles', 'global.css'), '@import "@master/css";')

        await expect(findMasterCSSWorkspaceDirectories(cwd)).resolves.toStrictEqual([
            cwd,
            join(cwd, 'docs', 'styles'),
            join(cwd, 'packages', 'app')
        ])
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('does not match sibling workspace path prefixes', async () => {
    const cwd = createFixture()
    try {
        mkdirSync(join(cwd, 'packages', 'app'), { recursive: true })
        mkdirSync(join(cwd, 'packages', 'app-kit'), { recursive: true })
        writeFileSync(join(cwd, 'packages', 'app', 'package.json'), JSON.stringify({
            dependencies: {
                '@master/css': 'workspace:*'
            }
        }))
        writeFileSync(join(cwd, 'packages', 'app-kit', 'index.css'), '@master;')

        await expect(findMasterCSSWorkspaceDirectories(cwd)).resolves.toStrictEqual([
            cwd,
            join(cwd, 'packages', 'app'),
            join(cwd, 'packages', 'app-kit')
        ])
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('turns CSS manifest results into JSON sources', async () => {
    const cwd = createFixture()
    try {
        const { entry } = writeCSSFixture(cwd)
        const result = await loadManifestJSON(entry)
        const syncResult = loadManifestJSONSync(entry + MASTER_CSS_MANIFEST_QUERY)

        expect(result.json).toContain('"version":1')
        expect(JSON.parse(result.json).version).toBe(1)
        expect(syncResult.json).toBe(result.json)
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('rejects script config paths', async () => {
    const cwd = createFixture()
    try {
        const script = join(cwd, 'config.ts')
        writeFileSync(script, 'export default {}')

        await expect(loadManifest(script)).rejects.toThrow('CSS files')
        expect(() => loadManifestSync(script)).toThrow('CSS files')
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})
