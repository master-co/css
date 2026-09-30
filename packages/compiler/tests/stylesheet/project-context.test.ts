import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { compileRenderedStylesheet, compileStylesheet, transformStylesheet } from '../../src/stylesheet/public'

const baseManifest: MasterCSSManifest = {
  "version": 4 as const,
  "languageVersion": 11 as const
}
const roots: string[] = []
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-project-context-')))
  roots.push(root)
  mkdirSync(join(root, 'theme'))
  const entry = join(root, 'theme', 'tokens #.css')
  writeFileSync(entry, "\n    @mixin --night { &:where([data-theme=\"night\"], [data-theme=\"night\"] *) { @contents; } }\n    @theme { :root, :host { --color-brand: red; --color-action: var(--color-brand);  } }\n@keyframes pop { to { opacity: .5; } }\n\n    @theme { [data-theme=\"night\"] { --color-brand: blue; } }\n\n     @mixin --action { color: var(--color-action); } \n    @source \"./never.html\";\n    .never { color: lime; }\n  ")
  return { root, entry, file: join(root, 'card.css'), options: { baseManifest, projectDir: root, referenceFiles: [entry], transformNativeStylesheets: true } }
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

test('a local named media query receives project definitions without another directive', async () => {
  const f = fixture()
  writeFileSync(f.entry, '@custom-media --wide (width >= 40rem); .unrelated { color: red; }')
  const result = await transformStylesheet(f.file, '.card { @media (--wide) { display: grid; } }', {
    ...f.options, transformNativeStylesheets: false
  })
  expect(result.transformed).toBe(true)
  expect(result.code).toContain('@media (width >= 40rem)')
  expect(result.code).toContain('display: grid')
  expect(result.code).not.toMatch(/--wide|unrelated/)
  expect(result.dependencies).toContain(f.entry)
})

test('native styles receive project tokens, modes, fallbacks and managed animations without an entry or reference', async () => {
  const f = fixture()
  const source = '.card { color: var(--external, var(--color-action)); animation: pop 1s; }'
  const result = await transformStylesheet(f.file, source, f.options)
  expect(result.transformed).toBe(true)
  expect(result.code).toContain(source)
  expect(result.code).toContain('--color-brand:red')
  expect(result.code).toContain('--color-action:var(--color-brand)')
  expect(result.code).toContain('[data-theme=night]{--color-brand:blue}')
  expect(result.code).not.toContain('@keyframes pop')
  expect(result.code).not.toMatch(/\.never|@source|@master|\.action\{/)
  expect(result.dependencies).toContain(f.entry)
  expect(result.dependencies).not.toContain(join(f.root, 'theme', 'never.html'))
})

test('host references precede authored references and local definitions, without leaking between calls', async () => {
  const f = fixture(), override = join(f.root, 'override.css')
  writeFileSync(override, "@theme {:root, :host { --color-brand: green; }}\n")
  const source = '@reference "./override.css";.card{color:var(--color-action);}'
  const explicit = await transformStylesheet(f.file, source, f.options)
  expect(explicit.code).toContain('--color-brand:green')
  const local = await transformStylesheet(f.file, source + "@theme {:root, :host { --color-brand: purple; }}\n", f.options)
  expect(local.code).toContain('--color-brand:purple')
  const next = await transformStylesheet(f.file, '.card{color:var(--color-action);}', f.options)
  expect(next.code).toContain('--color-brand:red')
  expect(next.code).not.toContain('purple')
})

test('standalone transformation remains opt-in and keeps unrelated CSS byte-for-byte', async () => {
  const f = fixture()
  const source = '/* var(--color-brand) */\r\n.empty { } .x { --label: "var(--color-brand)"; color: var(--external, red); }'
  writeFileSync(f.entry, "@layer theme { :root, :host { --color-brand: red; } }\n")
  const result = await transformStylesheet(f.file, source, f.options)
  expect(result.code).toBe(source)
  expect(result.transformed).toBe(false)
  expect(result.dependencies).toContain(f.entry)
  const disabled = await transformStylesheet(f.file, '.x{color:var(--color-brand)}', { ...f.options, transformNativeStylesheets: false })
  expect(disabled.transformed).toBe(false)
  const used = await transformStylesheet(f.file, '.x{color:var(--color-brand)}', f.options)
  expect(used.code).not.toContain('--color-brand:red')
})

test('separate globals preserve global mode selectors and external emission remains an explicit host assertion', async () => {
  const f = fixture()
  const source = '.card { color: var(--color-action); }'
  const result = await transformStylesheet(f.file, source, { ...f.options, generatedGlobals: 'separate' })
  expect(result.code).toBe(source)
  expect(result.globalStylesheet?.css).toContain(':root,:host')
  expect(result.globalStylesheet?.css).toContain('[data-theme=night]')
  const external = await transformStylesheet(f.file, source, { ...f.options, emittedGlobals: { variables: { 'color-action': 1, 'color-brand': 1 } } })
  expect(external.code).not.toContain('--color-brand:')
})

test.each([false, true])('definition files retain resource owners and dependencies with delivery=%s', async delivery => {
  const f = fixture(), image = join(f.root, 'theme', 'pixel.svg')
  writeFileSync(image, '<svg/>')
  writeFileSync(f.entry, "@theme {:root, :host { --image-card: url(\"./pixel.svg?v=1#icon\"); }}\n")
  const result = await transformStylesheet(f.file, '.card{background:var(--image-card);}', { ...f.options,
    ...(delivery ? { delivery: { entryURL: '/css/card.css', stylesheetURL: file => '/css/' + basename(file), resourceURL: file => '/assets/' + basename(file) } } : {})
  })
  expect(result.dependencies).toContain(f.entry)
  expect(result.code).toContain(delivery ? '/assets/pixel.svg?v=1#icon' : pathToFileURL(image).href + '?v=1#icon')
  if (delivery) expect(result.resources).toEqual([{ file: image, href: '/assets/pixel.svg' }])
})

test('reference files apply to rendered graphs without recursively referencing themselves', async () => {
  const f = fixture(), child = join(f.root, 'child.css')
  writeFileSync(child, '.child{color:var(--color-action);}')
  const result = await transformStylesheet(f.file, '@import "./child.css" layer(card);', { ...f.options,
    delivery: { entryURL: '/css/card.css', stylesheetURL: file => '/css/' + basename(file), resourceURL: file => '/assets/' + basename(file) }
  })
  expect(result.stylesheets?.find(asset => asset.id === child)?.css).toContain('var(--color-action)')
  expect(result.code).toContain('--color-brand:red')
  expect(result.code).not.toContain('.never')
})

test('direct compilation shares definition files and reports missing inputs before failure', async () => {
  const f = fixture()
  const result = await compileStylesheet(f.file, '.card{color:var(--color-action);}', f.options)
  expect(result.css).toContain('var(--color-action)')
  const missing = join(f.root, 'missing.css'), dependencies: string[] = []
  await expect(transformStylesheet(f.file, '.x{color:var(--color-brand)}', { ...f.options, referenceFiles: [missing], onDependency: file => dependencies.push(file) })).rejects.toThrow()
  expect(dependencies).toContain(missing)
  await expect(compileStylesheet(f.file, '', { ...f.options, referenceFiles: ['relative.css'] })).rejects.toThrow('absolute')
})

test('reused compilation observes nested edits, deletion and dependency callbacks', async () => {
  const f = fixture(), nested = join(f.root, 'theme', 'nested.css')
  writeFileSync(f.entry, '@import "./nested.css";')
  writeFileSync(nested, "@theme {:root, :host { --color-brand: red; }}\n")
  const run = (dependencies: string[]) => transformStylesheet(f.file, '.card{color:var(--color-brand)}', {
    ...f.options, onDependency: file => dependencies.push(file)
  })
  const first = await run([]), watched: string[] = []
  expect((await run(watched)).code).toBe(first.code)
  expect(watched).toContain(nested)
  writeFileSync(nested, "@theme {:root, :host { --color-brand: blue; }}\n")
  expect((await run([])).code).toContain('--color-brand:blue')
  rmSync(nested)
  await expect(run([])).rejects.toThrow()
  writeFileSync(nested, "@theme {:root, :host { --color-brand: green; }}\n")
  expect((await run([])).code).toContain('--color-brand:green')
})

test.each([false, true])('rendered outputs include explicitly referenced resources without exporting definitions, delivery=%s', async delivery => {
  const f = fixture()
  const result = await compileRenderedStylesheet(f.file, '@reference "./theme/tokens%20%23.css";.card{color:var(--color-action);animation:pop 1s}', {
    baseManifest, projectDir: f.root,
    ...(delivery ? { delivery: { entryURL: '/css/card.css', stylesheetURL: file => '/css/' + basename(file), resourceURL: file => '/assets/' + basename(file) } } : {})
  })
  expect(result.generatedCSS).toContain('--color-action:var(--color-brand)')
  expect(result.generatedCSS).not.toContain('@keyframes pop')
  expect(result.css).not.toContain('.never')
  expect(JSON.stringify(result.manifest)).not.toContain('color-brand')
})
