import { describe, expect, test } from 'vitest'
import {
    createMasterCSSChunkRenderer,
    createMasterCSSStaticHydrationManifestWriter,
    injectMasterStyle
} from '../src/lib/server.js'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
    MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function countManifestScripts(html: string) {
    return html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0
}

describe('Svelte server hook renderer', () => {
    test('injects collected CSS when the head closes', () => {
        const renderer = createMasterCSSChunkRenderer(defaultManifest)

        const html = [
            renderer.transform('<html><head><meta class="block">'),
            renderer.transform('</head><body><div class="fg:red"></div>', true)
        ].join('')

        expect(html).toContain('<style id="master-css">')
        expect(html).toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
        expect(html).toContain('"className":"block"')
        expect(html).toContain('"className":"fg:red"')
        expect(countManifestScripts(html)).toBe(1)
        expect(html).toContain('.block')
        expect(html).toContain('.fg\\:red')
        expect(html).toContain('</script></head>')
    })

    test('keeps streaming after early injection and leaves later classes to hydration', () => {
        const renderer = createMasterCSSChunkRenderer(defaultManifest)

        const html = [
            renderer.transform('<html><head><meta class="block"></head>'),
            renderer.transform('<body><div class="fg:red"></div>', true)
        ].join('')

        expect(html).toContain('.block')
        expect(html).not.toContain('.fg\\:red')
        expect(html).toContain('<body><div class="fg:red"></div>')
    })

    test('supports an external hydration manifest writer', () => {
        let manifestJSON = ''
        let manifestHash = ''
        const renderer = createMasterCSSChunkRenderer(defaultManifest, {
            type: 'external',
            write(json, hash) {
                manifestJSON = json
                manifestHash = hash
                return `/_master-css/hydration/master-css-hydration.${hash}.json`
            }
        })

        const html = renderer.transform('<html><head></head><body><div class="block"></div></body></html>', true)

        expect(manifestHash).toMatch(/^[0-9a-f]{8}$/)
        expect(JSON.parse(manifestJSON).rules.map((rule: { className: string }) => rule.className)).toEqual(['block'])
        expect(html).toContain(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/_master-css/hydration/master-css-hydration.${manifestHash}.json"`)
        expect(html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
        expect(countManifestScripts(html)).toBe(0)
    })

    test('does not duplicate emitted global variables and keyframes in streamed CSS', () => {
        const renderer = createMasterCSSChunkRenderer(defaultManifest, {
            emittedGlobals: {
                variables: {
                    'animate-fade': 1,
                    'color-red-60': 1
                },
                animations: {
                    fade: 1
                }
            }
        })

        const html = renderer.transform(
            '<html><head></head><body><div class="bg:red-60 animate:fade"></div></body></html>',
            true
        )

        expect(html).toContain('.bg\\:red-60{background-color:var(--color-red-60)}')
        expect(html).toContain('.animate\\:fade{animation:var(--animate-fade)}')
        expect(html).not.toContain('--color-red-60:')
        expect(html).not.toContain('--animate-fade:')
        expect(html).not.toContain('@keyframes fade')
    })

    test('writes static external hydration manifests', () => {
        const dir = mkdtempSync(join(tmpdir(), 'master-css-svelte-'))
        try {
            const write = createMasterCSSStaticHydrationManifestWriter({ outDir: dir })
            const source = write('{"version":1,"rules":[]}', '12345678')
            const file = join(dir, '_master-css', 'hydration', 'master-css-hydration.12345678.json')

            expect(source).toBe('/_master-css/hydration/master-css-hydration.12345678.json')
            expect(existsSync(file)).toBe(true)
            expect(readFileSync(file, 'utf-8')).toBe('{"version":1,"rules":[]}')
        } finally {
            rmSync(dir, { recursive: true, force: true })
        }
    })

    test('replaces an existing master style in the current chunk', () => {
        expect(injectMasterStyle('<head><style id="master-css"></style></head>', '.block{}'))
            .toBe('<head><style id="master-css">.block{}</style></head>')
    })

    test('replaces an existing hydration manifest in the current chunk', () => {
        const html = injectMasterStyle(
            `<head><style id="master-css"></style><script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script></head>`,
            '.block{}',
            `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[{"className":"block"}]}</script>`
        )

        expect(html).not.toContain('"rules":[]')
        expect(html).toContain('"className":"block"')
        expect(countManifestScripts(html)).toBe(1)
    })
})
