import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { loadProjectManifest } from '../../src/project/manifest'
import { transformStylesheet } from '../../src/stylesheet/public'

const baseManifest = preset as unknown as MasterCSSManifest
const rules = '.x { color: var(--color-project); @apply --ring; &:hover { color: blue } } @keyframes spin-x { to { rotate: 1turn } } .y { animation: spin-x 1s }'

// A component library can keep its rules in a sublayer, so that a project's
// own `@layer components` rules win whatever their specificity or order.
test.each([
  ['a dotted sublayer', `@layer components.ui { ${rules} }`, /^@layer components\.ui \{/, '@layer components.ui{@keyframes spin-x'],
  ['a nested sublayer', `@layer components { @layer ui { ${rules} } }`, /^@layer components \{\s*@layer ui \{/, '@layer components{@layer ui{@keyframes spin-x']
])('native rules in %s compile like those directly in the components layer', async (_name, source, opening, prunedKeyframes) => {
  const root = mkdtempSync(join(tmpdir(), 'master-nested-layers-'))
  const entry = join(root, 'app.css')
  writeFileSync(entry, '@import "@master/css";@theme{--color-project:red}@mixin --ring{outline:2px solid var(--color-project)}')
  const project = await loadProjectManifest({ root, entries: [entry], baseManifest })
  const options = {
    baseManifest: project.manifest, projectDir: root, referenceFiles: [entry], transformNativeStylesheets: true,
    delivery: { entryURL: 'https://host.test/entry.css', stylesheetURL: (file: string) => `https://host.test/${encodeURIComponent(file)}.css`, resourceURL: (file: string) => `https://host.test/r/${encodeURIComponent(file)}` }
  }
  const flat = await transformStylesheet(join(root, 'flat.css'), `@layer components { ${rules} }`, options)
  const layered = await transformStylesheet(join(root, 'layered.css'), source, options)
  expect(layered.code).toMatch(opening)
  expect(layered.code).toContain('.x{color:var(--color-project);outline:2px solid var(--color-project)}.x:hover{color:#00f}')
  expect(layered.code).toContain('@layer theme{:root,:host{--color-project:red}}')
  expect(layered.compilation?.nativeClassNames).toEqual(flat.compilation?.nativeClassNames)
  expect(layered.compilation?.nativeClassNames).toEqual(['x', 'y'])
  // Pruned native keyframes are emitted on demand inside the layers that declared them.
  const pruned = await transformStylesheet(join(root, 'pruned.css'), `@prune native;\n${source}`, options)
  expect(pruned.code.replace(/\s+/g, ' ')).toContain(prunedKeyframes)
})
