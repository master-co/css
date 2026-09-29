import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { expect, test } from 'vitest'
import { prepareStylesheet, transformStylesheet } from '../src/stylesheet/index-public'

const require = createRequire(new URL('../../vite/package.json', import.meta.url))
const sass = createRequire(require.resolve('vite'))('sass')
const baseManifest = {
  "variants": [
    {
      "token": "@all" as const,
      "branches": [
        {
          "conditions": [
            "@media all"
          ]
        }
      ]
    }
  ],
  "version": 4 as const,
  "languageVersion": 6 as const
}

async function fixture(run: (root: string) => Promise<void>) {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'prepared-source-context-')))
  try { mkdirSync(join(root, 'parts'));await run(root) }
  finally { rmSync(root, { recursive: true, force: true }) }
}

const identitySass = () => ({ async compileStringAsync(css: string) { return { css } } })

for (const syntax of ['scss', 'sass']) test(`single-source ${syntax} lowering retains an imported partial reference owner`, async () => {
  await fixture(async root => {
    const file = join(root, 'entry.' + syntax), token = join(root, 'parts/tokens.css')
    writeFileSync(join(root, 'parts/_rules.scss'), "@reference \"./tokens.css\";.card{@media all {padding:var(--paint-padding);}}")
    writeFileSync(token, "@theme {:root, :host {--paint-padding:2rem}}\n\n")
    writeFileSync(join(root, 'tokens.css'), "@theme {:root, :host {--paint-padding:99rem}}\n\n")
    const prepared = await prepareStylesheet(file, syntax === 'sass' ? '@use "parts/rules"\n' : '@use "parts/rules";', { loadSass: () => sass })
    const observed: string[] = []
    const result = await transformStylesheet(file, prepared.source, {
      baseManifest, projectDir: root, loadSass: identitySass, sourceMap: prepared.sourceMap,
      onDependency: file => observed.push(file)
    })
    expect(result.code).toContain('--paint-padding:2rem')
    expect(result.code).not.toContain('99rem')
    expect(result.dependencies).toContain(token)
    expect(observed).toContain(token)
  })
})

test('prepared source registers a missing mapped reference before failure and recovers', async () => {
  await fixture(async root => {
    const file = join(root, 'entry.scss'), token = join(root, 'parts/missing.css')
    writeFileSync(join(root, 'parts/_rules.scss'), "@reference \"./missing.css\";.card{@media all {padding:var(--paint-padding);}}")
    const prepared = await prepareStylesheet(file, '@use "parts/rules";', { loadSass: () => sass })
    const observed: string[] = [], options = { baseManifest, projectDir: root, loadSass: identitySass, sourceMap: prepared.sourceMap, onDependency: (file: string) => observed.push(file) }
    await expect(transformStylesheet(file, prepared.source, options)).rejects.toThrow()
    expect(observed).toContain(token)
    writeFileSync(token, "@theme {:root, :host {--paint-padding:4rem}}\n\n")
    expect((await transformStylesheet(file, prepared.source, options)).code).toContain('--paint-padding:4rem')
  })
})

test('prepared source reports invalid compose at the original partial diagnostic location', async () => {
  await fixture(async root => {
    const file = join(root, 'entry.scss'), partial = join(root, 'parts/_rules.scss')
    writeFileSync(partial, '/* 😀 original source */\n.bad { @compose "block"; }')
    const prepared = await prepareStylesheet(file, '@use "parts/rules";', { loadSass: () => sass })
    await expect(transformStylesheet(file, prepared.source, {
      baseManifest, projectDir: root, loadSass: identitySass, sourceMap: prepared.sourceMap
    })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ source: partial, range: { start: expect.objectContaining({ line: 1 }), end: expect.objectContaining({ line: 1 }) } })] })
  })
})
