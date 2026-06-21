import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
    createVirtualDefaultManifestModulePathPattern,
    ensureVirtualManifestModulePath,
    ensureVirtualEmittedGlobalsModulePath,
    fromResolvedMasterCSSManifestId,
    toHashedManifestAssetFileName,
    toResolvedMasterCSSManifestId,
    toVirtualCSSModulePath,
    toVirtualCSSManifestAssetPath,
    toVirtualCSSManifestModulePath,
    toVirtualDefaultManifestModulePath,
    toVirtualEmittedGlobalsModulePath
} from '../src/node'
import { EMPTY_MANIFEST_JSON } from '../src/manifest-module'
import { toInlineManifestModule } from '../src/manifest-facade'
import { EMPTY_EMITTED_GLOBALS_MODULE } from '../src/emitted-globals-module'

let fixtureDir: string | undefined

function createFixtureDir() {
    fixtureDir = mkdtempSync(path.join(tmpdir(), 'master-css-integration-node-'))
    return fixtureDir
}

afterEach(() => {
    if (fixtureDir) {
        rmSync(fixtureDir, { recursive: true, force: true })
        fixtureDir = undefined
    }
})

describe('@master/css-integration/node', () => {
    it('encodes resolved and filesystem virtual module paths', () => {
        const root = path.resolve('/project')
        const file = path.join(root, 'src/theme.css')
        const id = toResolvedMasterCSSManifestId(file)

        expect(id).not.toContain('.css')
        expect(id).not.toContain('%2Ecss')
        expect(fromResolvedMasterCSSManifestId(id)).toBe(file)
        expect(toVirtualDefaultManifestModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-css-manifest.js'))
        expect(toVirtualCSSManifestModulePath(root, file)).toMatch(/node_modules[/\\]\.master-css[/\\].+\.manifest\.js$/)
        expect(toVirtualCSSManifestAssetPath(root, file)).toMatch(/node_modules[/\\]\.master-css[/\\].+\.manifest\.json$/)
        expect(toVirtualCSSModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-utilities.css'))
        expect(toVirtualEmittedGlobalsModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-css-emitted-globals.js'))
        expect(createVirtualDefaultManifestModulePathPattern().test(toVirtualDefaultManifestModulePath(root))).toBe(true)
    })

    it('hashes manifest asset file names', () => {
        expect(toHashedManifestAssetFileName('{"version":1}')).toMatch(/^master-css-manifest\.[a-f0-9]{8}\.json$/)
        expect(toHashedManifestAssetFileName('{"version":1}', 'manifest')).toMatch(/^manifest\.[a-f0-9]{8}\.json$/)
    })

    it('updates stale virtual module placeholders', () => {
        const projectDir = createFixtureDir()
        const manifestPath = toVirtualDefaultManifestModulePath(projectDir)
        const emittedGlobalsPath = toVirtualEmittedGlobalsModulePath(projectDir)

        mkdirSync(path.dirname(manifestPath), { recursive: true })
        writeFileSync(manifestPath, 'export default { version: 1 };')
        writeFileSync(emittedGlobalsPath, 'export default {};')

        expect(ensureVirtualManifestModulePath(projectDir)).toBe(manifestPath)
        expect(ensureVirtualEmittedGlobalsModulePath(projectDir)).toBe(emittedGlobalsPath)
        expect(readFileSync(manifestPath, 'utf8')).toBe(toInlineManifestModule(EMPTY_MANIFEST_JSON))
        expect(readFileSync(emittedGlobalsPath, 'utf8')).toBe(EMPTY_EMITTED_GLOBALS_MODULE)
    })
})
