import { loadNativeCompilerBackend } from '@master/css-backend/compiler'
import { renderClassNamesSync } from '@master/css/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSServerRenderIR } from '@master/css-backend/engine'
import { beforeAll, expect, it } from 'vitest'
import parseHTML from '../src/parse-html'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

it('matches the core render owner and native render protocol', () => {
  const html = [
    '<html class="bg:white">',
    '<body><div class="text-center block:hover@sm text-center"></div></body>',
    '</html>'
  ].join('')
  const manifest = defaultManifestJSON as unknown as MasterCSSManifest
  const { classes } = parseHTML(html)
  const snapshot = renderClassNamesSync(classes, { manifest })

  const rust = loadNativeCompilerBackend({ required: true })!.renderClassNames(
    manifest,
    classes
  ) as MasterCSSServerRenderIR

  expect(rust.classes).toEqual(classes)
  expect(rust.snapshot.text).toBe(snapshot.cssText)
  expect(rust.hydrationManifest).toEqual(snapshot.hydrationManifest)
})
