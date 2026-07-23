import { it, expect } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderHTML } from '../../../../../src'
import fs from 'fs'
import path from 'path'

const html = fs.readFileSync(path.join(__dirname, './document.html'), 'utf8')
const rendered = renderHTML(html, {
  manifest: defaultManifestJSON as unknown as MasterCSSManifest
})

it('basic', () => {
  expect(rendered.html).toContain('.\\{font\\:mono\\;font-feature\\:normal\\}_\\:where\\(code\\,kbd\\,samp\\)')
})
