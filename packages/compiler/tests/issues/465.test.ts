import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createStylesheetCollection } from '../../src/stylesheet/index-public'
import { MasterCSSScanner } from '../helpers/scanner'

test('#465 explicit public PHP source contributes supported utilities without an automatic scan', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-issue-465-'))
  const scanner = new MasterCSSScanner({}, root)
  using collection = createStylesheetCollection()
  try {
    mkdirSync(join(root, 'public'))
    mkdirSync(join(root, 'resources'))
    writeFileSync(join(root, 'public/index.php'), '<h1 class="m:2xl italic font:5xl font:heavy text:neutral block">Hello World</h1>')
    const entry = join(root, 'resources/app.css')
    const source = '@import "@master/css"; @source "../public/index.php";'
    writeFileSync(entry, source)
    await scanner.init()
    await collection.register(scanner, entry, source, { baseManifest: scanner.css.manifest, projectDir: root })
    const result = await collection.compose({ scanner, baseManifest: scanner.css.manifest, projectDir: root })
    expect(result.css).toContain('.italic{font-style:italic}')
    expect(result.css).toContain('.block{display:block}')
    // Source extraction is distinct from removed rc.88 class semantics.
    expect(result.css).not.toContain('.m\\:2xl')
    expect(result.css).not.toContain('@source')
  } finally {
    await scanner.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})
