import { createRenderBindingSessionSync } from '@master/css-binding/engine/node'
import { renderClassNamesSync } from '@master/css/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { fileURLToPath } from 'node:url'
import { beforeAll, expect, it } from 'vitest'
import parseHTML from '../src/parse-html'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(
    new URL('../../binding/artifacts/mastercss.node', import.meta.url)
  )
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

  using session = createRenderBindingSessionSync({ manifest })
  session.ensureClassRules(classes)
  const rust = session.snapshotForClassNames(classes)

  expect(rust.classes).toEqual(classes)
  expect(rust.snapshot.text).toBe(snapshot.cssText)
  expect(rust.hydrationManifest).toEqual(snapshot.hydrationManifest)
})
