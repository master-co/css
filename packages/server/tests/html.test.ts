import { it, expect } from 'vitest'
import { render } from '../src'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID } from 'shared/master-css-hydration-manifest'
import type { MasterCSSManifest } from 'shared/master-css-manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function countHydrationManifestScripts(html: string) {
    return html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0
}

it('render <html>', () => {
    expect(render([
        '<html class="bg:white">',
        '<body><div class="text-center"></div></body>',
        '</html>'
    ].join(''), defaultManifest).html).toEqual([
        '<html class="bg:white">',
        '<head><style id="master-css">@layer utilities{.text-center{text-align:center}.bg\\:white{background-color:oklch(100% 0 none)}}</style></head>',
        '<body><div class="text-center"></div></body>',
        '</html>'
    ].join(''))
})

it('should not render the new style element', () => {
    expect(render([
        '<html class="bg:white">',
        '<head><style id="master-css"></style></head>',
        '</html>'
    ].join(''), defaultManifest).html).toEqual([
        '<html class="bg:white">',
        '<head><style id="master-css">@layer utilities{.bg\\:white{background-color:oklch(100% 0 none)}}</style></head>',
        '</html>'
    ].join(''))
})

it('returns a hydration manifest without changing rendered HTML', () => {
    const result = render('<html><head></head><body><div class="text-center"></div></body></html>', defaultManifest)

    expect(result.html).not.toContain('master-css-hydration-manifest')
    expect(result.hydrationManifest?.rules).toEqual([
        expect.objectContaining({
            className: 'text-center',
            text: '.text-center{text-align:center}',
            layer: 'utilities'
        })
    ])
})

it('injects the hydration manifest into an existing head when requested', () => {
    const result = render(
        '<html><head></head><body><div class="text-center"></div></body></html>',
        defaultManifest,
        { hydrationManifest: 'inject' }
    )

    expect(result.html).toContain('<head><style id="master-css">')
    expect(result.html).toContain(`<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">`)
    expect(result.html).toContain('"className":"text-center"')
    expect(countHydrationManifestScripts(result.html)).toBe(1)
})

it('creates a head for the injected hydration manifest when missing', () => {
    const result = render(
        '<html><body><div class="text-center"></div></body></html>',
        defaultManifest,
        { hydrationManifest: 'inject' }
    )

    expect(result.html).toContain('<head><style id="master-css">')
    expect(result.html).toContain(`<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">`)
    expect(result.html).toContain('"className":"text-center"')
    expect(countHydrationManifestScripts(result.html)).toBe(1)
})

it('replaces an existing hydration manifest script when requested', () => {
    const result = render(
        [
            '<html><head>',
            `<script type="text/plain" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
            '</head><body><div class="text-center"></div></body></html>'
        ].join(''),
        defaultManifest,
        { hydrationManifest: 'inject' }
    )

    expect(result.html).not.toContain('{"version":1,"rules":[]}')
    expect(result.html).toContain(`<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">`)
    expect(result.html).toContain('"className":"text-center"')
    expect(countHydrationManifestScripts(result.html)).toBe(1)
})

it('can skip returning and injecting the hydration manifest', () => {
    const result = render(
        '<html><head></head><body><div class="text-center"></div></body></html>',
        defaultManifest,
        { hydrationManifest: false }
    )

    expect(result.hydrationManifest).toBeUndefined()
    expect(result.html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
})

it('removes an empty master style when hydration manifest injection is requested', () => {
    const result = render(
        '<html><head><style id="master-css"></style></head><body><div class="unknown-native"></div></body></html>',
        defaultManifest,
        { hydrationManifest: 'inject' }
    )

    expect(result.html).toBe('<html><head></head><body><div class="unknown-native"></div></body></html>')
    expect(result.hydrationManifest?.rules).toEqual([])
    expect(result.styleElement).toBeNull()
})
