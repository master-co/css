import { it, test, expect } from 'vitest'
import { render } from '../src'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

it('should not encode entities', () => {
  expect(render(
    '<span class="token punctuation">&lt;</span>div<span class="token punctuation">&gt;</span>',
    defaultManifest
  ).html
  ).toContain(
    '<span class="token punctuation">&lt;</span>div<span class="token punctuation">&gt;</span>'
  )
})

test('>', () => {
  expect(render(
    `<div class="mt:0&gt;div"></div>`,
    defaultManifest
  ).html).toEqual([
    '<style id="master-css">@layer utilities{.mt\\:0\\>div>div{margin-top:0}}</style>',
    `<div class="mt:0&gt;div"></div>`
  ].join(''))
})

test('\'', () => {
  expect(render(
    `<div class="font-feature-settings:'salt'"></div>`,
    defaultManifest
  ).html).toEqual([
    `<style id="master-css">@layer utilities{.font-feature-settings\\:\\'salt\\'{font-feature-settings:'salt'}}</style>`,
    `<div class="font-feature-settings:'salt'"></div>`
  ].join(''))
})
