import { expect, it } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderHTML } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function render(html: string, hydrationManifest?: Parameters<typeof renderHTML>[1]['hydrationManifest']) {
  return renderHTML(html, {
    manifest: defaultManifest,
    hydrationManifest
  })
}

function countHydrationManifestScripts(html: string) {
  return html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0
}

it('render <html>', () => {
  expect(render([
    '<html class="bg:white">',
    '<body><div class="text-center"></div></body>',
    '</html>'
  ].join('')).html).toEqual([
    '<html class="bg:white">',
    '<head><style id="master-css">@layer utilities{.text-center{text-align:center}.bg\\:white{background-color:oklch(100% 0 none)}}</style></head>',
    '<body><div class="text-center"></div></body>',
    '</html>'
  ].join(''))
})

it('should not render the new style element', () => {
  const result = render([
    '<html class="bg:white">',
    '<head><style id="master-css"></style></head>',
    '</html>'
  ].join(''))

  expect(result.html).toEqual([
    '<html class="bg:white">',
    '<head><style id="master-css">@layer utilities{.bg\\:white{background-color:oklch(100% 0 none)}}</style></head>',
    '</html>'
  ].join(''))
  expect(result.html.match(/id="master-css"/g)).toHaveLength(1)
})

it('returns a hydration manifest without changing rendered HTML', () => {
  const result = render('<html><head></head><body><div class="text-center"></div></body></html>')

  expect(result.html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
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
    'inject'
  )

  expect(result.html).toContain('<head><style id="master-css">')
  expect(result.html).toContain(`<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">`)
  expect(result.html).toContain('"className":"text-center"')
  expect(countHydrationManifestScripts(result.html)).toBe(1)
})

it('attaches an external hydration manifest source to style#master-css when requested', () => {
  const source = '/_master-css/hydration/master-css-hydration.12345678.json'
  const result = render(
    '<html><head></head><body><div class="text-center"></div></body></html>',
    { type: 'external', source }
  )

  expect(result.html).toContain(
    `<style id="master-css" ${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="${source}"`
  )
  expect(result.html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
  expect(result.hydrationManifest?.rules).toEqual([
    expect.objectContaining({ className: 'text-center' })
  ])
})

it('removes stale inline hydration scripts in external hydration manifest mode', () => {
  const source = '/_master-css/hydration/master-css-hydration.12345678.json'
  const result = render([
    '<html><head>',
    '<style id="master-css"></style>',
    `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
    '</head><body><div class="text-center"></div></body></html>'
  ].join(''), { type: 'external', source })

  expect(result.html).toContain(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="${source}"`)
  expect(result.html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
  expect(countHydrationManifestScripts(result.html)).toBe(0)
})

it('emits no external hydration manifest pointer for empty generated CSS', () => {
  const result = render([
    '<html><head>',
    `<style id="master-css" ${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/stale.json"></style>`,
    `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
    '</head><body><div class="unknown-native"></div></body></html>'
  ].join(''), {
    type: 'external',
    source: '/_master-css/hydration/master-css-hydration.12345678.json'
  })

  expect(result.html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_ATTR)
  expect(result.html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
  expect(result.hydrationManifest?.rules).toEqual([])
})

it('creates a head for the injected hydration manifest when missing', () => {
  const result = render(
    '<html><body><div class="text-center"></div></body></html>',
    'inject'
  )

  expect(result.html).toContain('<head><style id="master-css">')
  expect(result.html).toContain(`<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">`)
  expect(result.html).toContain('"className":"text-center"')
  expect(countHydrationManifestScripts(result.html)).toBe(1)
})

it('replaces an existing hydration manifest script when requested', () => {
  const result = render([
    '<html><head>',
    `<script type="text/plain" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
    '</head><body><div class="text-center"></div></body></html>'
  ].join(''), 'inject')

  expect(result.html).not.toContain('{"version":1,"rules":[]}')
  expect(result.html).toContain(`<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">`)
  expect(result.html).toContain('"className":"text-center"')
  expect(countHydrationManifestScripts(result.html)).toBe(1)
})

it('can skip returning and injecting the hydration manifest', () => {
  const result = render(
    '<html><head></head><body><div class="text-center"></div></body></html>',
    false
  )

  expect(result.hydrationManifest).toBeUndefined()
  expect(result.html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
})

it('removes an empty master style when hydration manifest injection is requested', () => {
  const result = render(
    '<html><head><style id="master-css"></style></head><body><div class="unknown-native"></div></body></html>',
    'inject'
  )

  expect(result.html).toBe('<html><head></head><body><div class="unknown-native"></div></body></html>')
  expect(result.hydrationManifest?.rules).toEqual([])
  expect(result.html).not.toContain('style id="master-css"')
})
