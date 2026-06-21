import { describe, expect, test } from 'vitest'
import {
    createMasterCSSChunkRenderer,
    injectMasterStyle
} from '../src/lib/server.js'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID } from 'shared/master-css-hydration-manifest'
import type { MasterCSSManifest } from 'shared/master-css-manifest'

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

        expect(html).toContain('<style id="master">')
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

    test('replaces an existing master style in the current chunk', () => {
        expect(injectMasterStyle('<head><style id="master"></style></head>', '.block{}'))
            .toBe('<head><style id="master">.block{}</style></head>')
    })

    test('replaces an existing hydration manifest in the current chunk', () => {
        const html = injectMasterStyle(
            `<head><style id="master"></style><script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script></head>`,
            '.block{}',
            `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[{"className":"block"}]}</script>`
        )

        expect(html).not.toContain('"rules":[]')
        expect(html).toContain('"className":"block"')
        expect(countManifestScripts(html)).toBe(1)
    })
})
