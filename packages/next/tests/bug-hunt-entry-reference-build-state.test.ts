import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { resolveMasterCSSBuildState } from '../src/build-state'
for (const child of [false, true]) test(`Next build completion preserves entry reference metadata, imported=${child}`, async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-entry-reference-state-'))
  try {
    mkdirSync(join(root, 'app'))
    const entry = join(root, 'app/globals.css'), rules = join(root, 'app/rules.css'), token = join(root, 'app/tokens.css')
    writeFileSync(token, '@utilities{audit-margin{margin:3rem}}')
    const source = '@reference "./tokens.css";.card{@compose audit-margin;}'
    writeFileSync(entry, '@master entry;' + (child ? '@import "./rules.css";' : source))
    if (child) writeFileSync(rules, source)
    const result = await resolveMasterCSSBuildState(root, ['card'])
    expect(result.nativeCSS).toContain('margin:3rem')
    expect(result.dependencies).toContain(token)
    expect(JSON.stringify(result.manifest)).not.toContain('audit-margin')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
