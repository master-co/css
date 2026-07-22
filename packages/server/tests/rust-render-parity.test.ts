import { createHydrationManifest } from '@master/css'
import { loadNativeBinding } from '@master/css-native'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSServerRenderIR } from '@master/css-schema/rust-contract'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { beforeAll, expect, it } from 'vitest'
import { createCSSWithNativeDeclarations } from '@master/css-validator'
import parseHTML from '../src/parse-html'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

it('matches server CSS and hydration composition', () => {
  const html = [
    '<html class="bg:white">',
    '<body><div class="text-center block:hover@sm text-center"></div></body>',
    '</html>'
  ].join('')
  const manifest = defaultManifestJSON as unknown as MasterCSSManifest
  const { classes } = parseHTML(html)
  const css = createCSSWithNativeDeclarations(manifest)
  classes.forEach((className) => css.ensureClassRules(className))

  const binding = loadNativeBinding({ required: true })!.binding
  const rust = JSON.parse(binding.renderClassesJson(
    JSON.stringify(manifest),
    classes
  )) as MasterCSSServerRenderIR

  expect(rust.classes).toEqual(classes)
  expect(rust.snapshot.text).toBe(css.text)
  expect(rust.hydrationManifest).toEqual(createHydrationManifest(css))
})
