import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createEngineSync } from '@master/css/node'
import { loadProjectManifest } from '@master/css-compiler/project'
import { compileManifestSync } from '../src/node'
import { compileCSSManifestFile } from '../src/node-compiler'
import { MasterCSSScanner } from './helpers/scanner'

const definitions = '@theme{--font-family-sans:sans-serif;--font-size-sm:1rem}@utility font-(--font-family){font-family:var(--font-family)}@utility font-(--font-size){font-size:var(--font-size)}'
const baseManifest = { version: 6, languageVersion: 16 } as const

for (const directive of ['import', 'reference']) test(`${directive} retains shared branches and replaces only the authored namespace`, async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-shared-prefix-')))
  try {
    const entry = join(root, 'entry.css')
    writeFileSync(join(root, 'tokens.css'), definitions + '.reference-native{color:red}')
    writeFileSync(entry, `@${directive} './tokens.css';@utility font-(--font-size){font-size:var(--font-size);line-height:2}`)
    const project = await loadProjectManifest({ root, entries: [entry], baseManifest })
    // References supply resolution context without publishing their registrations.
    const manifest = directive === 'reference'
      ? compileCSSManifestFile(entry, { baseManifest }).resolutionManifest
      : project.manifest
    using engine = createEngineSync({ manifest })
    expect(engine.inspect('font-sm').rules[0].text).toContain('font-size:var(--font-size-sm);line-height:2')
    expect(engine.inspect('font-sans').rules[0].text).toContain('font-family:var(--font-family-sans)')
    expect(manifest.utilities?.filter(utility => utility.name === 'font')).toHaveLength(2)
    if (directive === 'reference') {
      expect(project.manifest.utilities?.filter(utility => utility.name === 'font')).toHaveLength(1)
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('scanner rechecks shared-prefix classes and resources after token changes', async () => {
  const manifest = compileManifestSync(definitions, { baseManifest }).manifest
  const ambiguous = compileManifestSync(definitions + '@theme{--font-family-sm:serif}', { baseManifest }).manifest
  const scanner = new MasterCSSScanner({ manifest })
  const source = '<div class="font-sm font-sans"></div>'
  try {
    await scanner.init()
    await scanner.scan('example.html', source)
    expect(scanner.css.text).toContain('.font-sm{')
    await scanner.reset({ manifest: ambiguous })
    await scanner.scan('example.html', source)
    expect(scanner.css.text).not.toContain('.font-sm{')
    expect(scanner.css.text).not.toContain('--font-size-sm:')
    expect(scanner.css.text).toContain('.font-sans{')
    await scanner.reset({ manifest })
    await scanner.scan('example.html', source)
    expect(scanner.css.text).toContain('.font-sm{')
  } finally { await scanner.dispose() }
})
