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

it('injects generated CSS into documents with or without a head', () => {
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

it('updates an existing master style without duplicating it', () => {
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

it('returns hydration state without mutating HTML by default', () => {
  const result = render(
    '<html><head></head><body><div class="text-center"></div></body></html>'
  )

  expect(result.html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
  expect(result.hydrationManifest?.rules).toEqual([
    expect.objectContaining({
      className: 'text-center',
      text: '.text-center{text-align:center}',
      layer: 'utilities'
    })
  ])
})

it('injects exactly one hydration manifest and replaces stale copies', () => {
  const result = render([
    '<html><head>',
    `<script type="text/plain" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
    `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
    '</head><body><div class="text-center"></div></body></html>'
  ].join(''), 'inject')

  expect(result.html).not.toContain('{"version":1,"rules":[]}')
  expect(result.html).toContain(
    `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">`
  )
  expect(result.html).toContain('"className":"text-center"')
  expect(countHydrationManifestScripts(result.html)).toBe(1)
})

it('creates a head when inline hydration is requested', () => {
  const result = render(
    '<html><body><div class="text-center"></div></body></html>',
    'inject'
  )

  expect(result.html).toContain('<head><style id="master-css">')
  expect(result.html).toContain(
    `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">`
  )
})

it('attaches an external hydration source and removes stale inline state', () => {
  const source = '/_master-css/hydration/master-css-hydration.12345678.json'
  const result = render([
    '<html><head>',
    '<style id="master-css"></style>',
    `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
    '</head><body><div class="text-center"></div></body></html>'
  ].join(''), {
    type: 'external',
    source
  })

  expect(result.html).toContain(
    `${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="${source}"`
  )
  expect(result.html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
  expect(result.hydrationManifest?.rules).toEqual([
    expect.objectContaining({ className: 'text-center' })
  ])
})

it('supports an external hydration manifest writer callback', () => {
  let written = ''
  const result = render(
    '<div class="text-center"></div>',
    {
      type: 'external',
      source(json) {
        written = json
        return '/hydration.json'
      }
    }
  )

  expect(written).toContain('"className":"text-center"')
  expect(result.html).toContain(
    `${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/hydration.json"`
  )
})

it('removes stale style and hydration state when no CSS is generated', () => {
  const result = render([
    '<html><head>',
    `<style id="master-css" ${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/stale.json"></style>`,
    `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
    '</head><body><div class="unknown-native"></div></body></html>'
  ].join(''), {
    type: 'external',
    source: '/hydration.json'
  })

  expect(result.html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_ATTR)
  expect(result.html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
  expect(result.hydrationManifest?.rules).toEqual([])
})

it('can suppress hydration state entirely', () => {
  const result = render(
    '<html><head></head><body><div class="text-center"></div></body></html>',
    false
  )

  expect(result.hydrationManifest).toBeUndefined()
  expect(result.html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
})

it('does not expose parser nodes or live renderer resources', () => {
  const result = render('<div class="text-center"></div>')
  expect(Object.keys(result).sort()).toEqual([
    'classNames',
    'cssText',
    'diagnostics',
    'html',
    'hydrationManifest',
    'invalidClassNames'
  ])
})
