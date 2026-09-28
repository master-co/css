import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createStylesheetCollection } from '../src/stylesheet/index-public'
import { MasterCSSScanner } from './helpers/scanner'

for (const deliver of [false, true]) test(`collection source selection isolates native CSS and resource ownership: delivery=${deliver}`, async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-collection-owners-')))
  const scanner = new MasterCSSScanner({}, root)
  using collection = createStylesheetCollection()
  try {
    await scanner.init()
    const ids = ['a', 'b'].map(name => join(root, `${name}.css`))
    for (const [index, id] of ids.entries()) {
      const name = index ? 'b' : 'a'
      writeFileSync(join(root, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" id="${name}"/>`)
      writeFileSync(id, `@import "@master/css";@preserve native;.owner-${name}{color:${index ? 'blue' : 'red'};background-image:url("./${name}.svg")}`)
      await collection.register(scanner, id, readFileSync(id, 'utf8'), { baseManifest: scanner.css.manifest, projectDir: root })
    }
    const options = { scanner, baseManifest: scanner.css.manifest, projectDir: root, classes: ['block'],
      ...(deliver ? { delivery: { relativeResourceURLs: true, entryURL: './entry.css', stylesheetURL: (file: string, variant?: string) => `./${Buffer.from(variant ?? file).toString('hex')}.css`, resourceURL: (file: string) => `./${file.split('/').at(-1)}` } } : {}) }
    const text = (result: Awaited<ReturnType<typeof collection.compose>>) => [result.css, ...(result.stylesheets ?? []).map(asset => asset.css)].join('\n')
    const selected = await collection.compose({ ...options, sourceIds: [ids[0] + '?owner'] })
    expect(text(selected)).toContain('.owner-a')
    expect(text(selected)).not.toContain('.owner-b')
    expect(text(selected)).toContain('.block{display:block}')
    expect(selected.dependencies).toContain(ids[0])
    expect(selected.dependencies).not.toContain(ids[1])
    if (deliver) expect(selected.resources?.map(resource => resource.file)).toEqual([join(root, 'a.svg')])
    const empty = await collection.compose({ ...options, sourceIds: [] })
    expect(text(empty)).not.toMatch(/owner-[ab]/)
    expect(text(empty)).toContain('.block{display:block}')
    expect(collection.snapshot().sourceIds).toEqual(ids)
    const all = await collection.compose(options)
    expect(text(all)).toContain('.owner-a')
    expect(text(all)).toContain('.owner-b')
  } finally { await scanner.dispose();rmSync(root, { recursive: true, force: true }) }
})

test('strict registration failure retains both the successful stylesheet and native owners', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-strict-owner-')))
  const scanner = new MasterCSSScanner({}, root)
  using collection = createStylesheetCollection()
  try {
    await scanner.init()
    const id = join(root, 'app.css')
    const options = { baseManifest: scanner.css.manifest, projectDir: root, validation: 'error' as const }
    await collection.register(scanner, id, "@import \"@master/css\";.previous{padding:1px}", options)
    expect(scanner.nativeClassNames.has('previous')).toBe(true)
    await expect(collection.register(scanner, id, "@import \"@master/css\";.failed{font:16px}", options)).rejects.toThrow('Strict CSS validation failed')
    expect(scanner.nativeClassNames.has('previous')).toBe(true)
    expect(scanner.nativeClassNames.has('failed')).toBe(false)
    const result = await collection.compose({ ...options, scanner })
    expect(result.css).toContain('.previous')
    expect(result.css).not.toContain('.failed')
  } finally { await scanner.dispose(); rmSync(root, { recursive: true, force: true }) }
})

test('collection emits referenced native resources once without exposing reference utilities', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-reference-native-resources-')))
  const scanner = new MasterCSSScanner({}, root)
  using collection = createStylesheetCollection()
  try {
    await scanner.init()
    writeFileSync(join(root, 'tokens.css'), "@theme { :root, :host {--color-accent:#123456;} }\n\n@keyframes pop{to{opacity:1}}\n@utility reference-only {color:blue}.reference-native{color:red}")
    const source = "@import \"@master/css\";@reference \"./tokens.css\";@keyframes local{to{opacity:0}}.card{color:var(--color-accent);animation:pop 1s,local 2s}"
    const id = join(root, 'entry.css')
    await collection.register(scanner, id, source, { baseManifest: scanner.css.manifest, projectDir: root })
    const result = await collection.compose({ scanner, baseManifest: scanner.css.manifest, projectDir: root, classes: ['reference-only', 'block'] })
    const css = [result.css, ...(result.stylesheets ?? []).map(asset => asset.css)].join('\n')
    expect(css).toContain('--color-accent:#123456')
    expect(css).not.toContain("@keyframes pop")
    expect(css.match(/@keyframes local/g)).toHaveLength(1)
    expect(result.emittedGlobals.variables).toMatchObject({ 'color-accent': 1 })
    expect(css).toContain('.block{display:block}')
    expect(css).not.toMatch(/reference-only|reference-native/)
  } finally { await scanner.dispose(); rmSync(root, { recursive: true, force: true }) }
})
