import { it, expect } from 'vitest'
import { renderHTML } from '../src'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

it('render elements', () => {
  expect(renderHTML([
    '<div class="text-center"></div>',
    '<div class="bg:white"></div>'
  ].join(''), { manifest: defaultManifest }).html).toEqual([
    '<style id="master-css">@layer utilities{.text-center{text-align:center}.bg\\:white{background-color:oklch(100% 0 none)}}</style>',
    '<div class="text-center"></div>',
    '<div class="bg:white"></div>'
  ].join(''))
})
