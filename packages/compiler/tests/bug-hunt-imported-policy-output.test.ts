import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileRenderedStylesheet, createExtractedCSS, registerStylesheetSource } from '../src/stylesheet'
import { MasterCSSScanner } from './helpers/scanner'

for (const qualifier of ['layer', 'layer(scope)', 'supports(display:grid)', 'screen', 'layer(scope) supports(display:grid) screen']) {
  test(`BH-0004 consumed policy must not remain in ${qualifier} CSS output`, async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-imported-policy-output-'))
    const scanner = new MasterCSSScanner({}, root)
    try {
      mkdirSync(join(root, 'styles/views'), { recursive: true })
      writeFileSync(join(root, 'styles/child.css'), "@source './views/*.html';@safelist 'flex';")
      writeFileSync(join(root, 'styles/views/view.html'), '<div class="block"></div>')
      await scanner.init()
      const stylesheetSources = new Map()
      await registerStylesheetSource(scanner, stylesheetSources, join(root, 'entry.css'), `@import './styles/child.css' ${qualifier};@master entry;`, { baseManifest: scanner.css.manifest })
      const css = await createExtractedCSS({ scanner, stylesheetSources, baseManifest: scanner.css.manifest, projectDir: root })
      expect(css).toContain('.block{display:block}')
      expect(css).toContain('.flex{display:flex}')
      expect(css).not.toMatch(/@(?:source|safelist)\b/)
    } finally { await scanner.dispose(); rmSync(root, { recursive: true, force: true }) }
  })
}

for (const qualifier of ['layer', 'layer(scope)', 'supports(display:grid)', 'screen', 'layer(scope) supports(display:grid) screen']) {
  test(`BH-0004 graph compilation consumes policies before ${qualifier} wrapping`, async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-policy-graph-control-'))
    try {
      writeFileSync(join(root, 'child.css'), '@source "./views/*.html";@safelist "flex";.sentinel{display:grid}')
      const result = await compileRenderedStylesheet(join(root, 'entry.css'), `@import './child.css' ${qualifier};@master entry;`, {
        baseManifest: { version: 1, languageVersion: 2, utilities: [] }, projectDir: root
      })
      expect(result.css).not.toMatch(/@(?:source|safelist|master)\b/)
      expect(result.css).toContain('.sentinel')
      expect(result.css).toMatch(/display:\s*grid/)
      if (qualifier.includes('layer')) expect(result.css).toContain('@layer')
      if (qualifier.includes('supports')) expect(result.css).toContain('@supports')
      if (qualifier.includes('screen')) expect(result.css).toContain('@media screen')
      expect(result.dependencies).toContain(join(root, 'child.css'))
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}
