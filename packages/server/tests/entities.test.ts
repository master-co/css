import { it, test, expect } from 'vitest'
import { renderHTML } from '../src'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

it('should not encode entities', () => {
  expect(renderHTML(
    '<span class="token punctuation">&lt;</span>div<span class="token punctuation">&gt;</span>',
    { manifest: defaultManifest }
  ).html
  ).toContain(
    '<span class="token punctuation">&lt;</span>div<span class="token punctuation">&gt;</span>'
  )
})

test('>', () => {
  expect(renderHTML(
    `<div class="mt:0&gt;div"></div>`,
    { manifest: defaultManifest }
  ).html).toEqual([
    '<style id="master-css">@layer utilities{.mt\\:0\\>div>div{margin-top:0}}</style>',
    `<div class="mt:0&gt;div"></div>`
  ].join(''))
})

test('\'', () => {
  expect(renderHTML(
    `<div class="font-feature-settings:'salt'"></div>`,
    { manifest: defaultManifest }
  ).html).toEqual([
    `<style id="master-css">@layer utilities{.font-feature-settings\\:\\'salt\\'{font-feature-settings:'salt'}}</style>`,
    `<div class="font-feature-settings:'salt'"></div>`
  ].join(''))
})
