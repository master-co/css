import { it, expect } from 'vitest'
import { render } from '../src'
import { defaultPlan } from '@master/css'
import { MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID } from 'shared/master-css-runtime-manifest'

function countManifestScripts(html: string) {
    return html.match(new RegExp(`id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0
}

it('render <html>', () => {
    expect(render([
        '<html class="bg:white">',
        '<body><div class="text:center"></div></body>',
        '</html>'
    ].join(''), defaultPlan).html).toEqual([
        '<html class="bg:white">',
        '<head><style id="master">@layer utilities{.bg\\:white{background-color:oklch(100% 0 none)}.text\\:center{text-align:center}}</style></head>',
        '<body><div class="text:center"></div></body>',
        '</html>'
    ].join(''))
})

it('should not render the new style element', () => {
    expect(render([
        '<html class="bg:white">',
        '<head><style id="master"></style></head>',
        '</html>'
    ].join(''), defaultPlan).html).toEqual([
        '<html class="bg:white">',
        '<head><style id="master">@layer utilities{.bg\\:white{background-color:oklch(100% 0 none)}}</style></head>',
        '</html>'
    ].join(''))
})

it('returns a runtime manifest without changing rendered HTML', () => {
    const result = render('<html><head></head><body><div class="text:center"></div></body></html>', defaultPlan)

    expect(result.html).not.toContain('master-css-runtime-manifest')
    expect(result.manifest?.rules).toEqual([
        expect.objectContaining({
            className: 'text:center',
            text: '.text\\:center{text-align:center}',
            layer: 'utilities'
        })
    ])
})

it('injects the runtime manifest into an existing head when requested', () => {
    const result = render(
        '<html><head></head><body><div class="text:center"></div></body></html>',
        defaultPlan,
        { runtimeManifest: 'inject' }
    )

    expect(result.html).toContain('<head><style id="master">')
    expect(result.html).toContain(`<script type="application/json" id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}">`)
    expect(result.html).toContain('"className":"text:center"')
    expect(countManifestScripts(result.html)).toBe(1)
})

it('creates a head for the injected runtime manifest when missing', () => {
    const result = render(
        '<html><body><div class="text:center"></div></body></html>',
        defaultPlan,
        { runtimeManifest: 'inject' }
    )

    expect(result.html).toContain('<head><style id="master">')
    expect(result.html).toContain(`<script type="application/json" id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}">`)
    expect(result.html).toContain('"className":"text:center"')
    expect(countManifestScripts(result.html)).toBe(1)
})

it('replaces an existing runtime manifest script when requested', () => {
    const result = render(
        [
            '<html><head>',
            `<script type="text/plain" id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
            '</head><body><div class="text:center"></div></body></html>'
        ].join(''),
        defaultPlan,
        { runtimeManifest: 'inject' }
    )

    expect(result.html).not.toContain('{"version":1,"rules":[]}')
    expect(result.html).toContain(`<script type="application/json" id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}">`)
    expect(result.html).toContain('"className":"text:center"')
    expect(countManifestScripts(result.html)).toBe(1)
})

it('can skip returning and injecting the runtime manifest', () => {
    const result = render(
        '<html><head></head><body><div class="text:center"></div></body></html>',
        defaultPlan,
        { runtimeManifest: false }
    )

    expect(result.manifest).toBeUndefined()
    expect(result.html).not.toContain(MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID)
})

it('removes an empty master style when runtime manifest injection is requested', () => {
    const result = render(
        '<html><head><style id="master"></style></head><body><div class="unknown-native"></div></body></html>',
        defaultPlan,
        { runtimeManifest: 'inject' }
    )

    expect(result.html).toBe('<html><head></head><body><div class="unknown-native"></div></body></html>')
    expect(result.manifest?.rules).toEqual([])
    expect(result.styleElement).toBeNull()
})
