import { it, expect } from 'vitest'
import { renderHTML } from '../src'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

it('render elements', () => {
  expect(renderHTML([
    "<div class=\"text-align:center\"></div>",
    '<div class="bg-white"></div>'
  ].join(''), { manifest: defaultManifest }).html).toEqual([
    "<style id=\"master-css\">@layer theme{:root,:host{--color-white:oklch(100% 0 none)}}@layer utilities{.bg-white{background-color:var(--color-white)}.text-align\\:center{text-align:center}}</style>",
    "<div class=\"text-align:center\"></div>",
    '<div class="bg-white"></div>'
  ].join(''))
})
