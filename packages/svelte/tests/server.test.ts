import { describe, expect, test } from 'vitest'
import {
    createMasterCSSChunkRenderer,
    injectMasterStyle
} from '../src/lib/server.js'
import { defaultPlan } from '@master/css'

describe('Svelte server hook renderer', () => {
    test('injects collected CSS when the head closes', () => {
        const renderer = createMasterCSSChunkRenderer(defaultPlan)

        const html = [
            renderer.transform('<html><head><meta class="block">'),
            renderer.transform('</head><body><div class="fg:red"></div>', true)
        ].join('')

        expect(html).toContain('<style id="master">')
        expect(html).toContain('.block')
        expect(html).toContain('.fg\\:red')
        expect(html).toContain('</style></head>')
    })

    test('keeps streaming after early injection and leaves later classes to hydration', () => {
        const renderer = createMasterCSSChunkRenderer(defaultPlan)

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
})
