import { expect, test } from 'vitest'
import { createRequire } from 'node:module'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import { createNextPostCSSResourceHook, rebasePostCSSResources } from '../src/postcss-resource-policy'
import { createPostCSSRequestPlugins } from '../src/postcss-request-plugins'

const require = createRequire(import.meta.url)
const postcss = createRequire(require.resolve('next/package.json'))('postcss')
interface Decl { prop: string; value: string; remove(): void }
interface Root {
  append(value: unknown): void
  walkDecls(callback: (declaration: Decl) => void): void
  walkRules(selector: string, callback: (root: Root) => void): void
  toString(): string
}
const baseManifest = { version: 1 as const, languageVersion: 3 as const, utilities: [] }
const source = '@theme{--color-old:#111111;--color-late:#abcdef}.card{color:var(--color-old)}'
function declarations(root: Root) {
  const values: [string, string][] = []
  root.walkDecls(declaration => values.push([declaration.prop, declaration.value]))
  return values.sort((a, b) => a.join(':').localeCompare(b.join(':')))
}

for (const mutation of ['delete', 'rename', 'rename-references', 'edit'] as const) {
  test(`processed resource history preserves native PostCSS intent: ${mutation}`, async () => {
    const first = await compileRenderedStylesheet('/audit/entry.css', source, { baseManifest })
    const counts: number[] = []
    async function run(master: boolean) {
      let once = 0
      const plugins = [{ postcssPlugin: 'mutate-old', Once(root: Root) {
        once++
        root.walkDecls(declaration => {
          if (declaration.prop === '--color-old') {
            if (mutation === 'delete') declaration.remove()
            else if (mutation === 'edit') declaration.value = '#123456'
            else declaration.prop = '--color-renamed'
          }
          if (mutation === 'rename-references' && declaration.value === 'var(--color-old)') declaration.value = 'var(--color-renamed)'
        })
        root.walkRules('.card', rule => rule.append({ prop: 'background-color', value: 'var(--color-late)' }))
      } }, { postcssPlugin: 'consume-late', Once(root: Root) {
        root.walkDecls(declaration => { if (declaration.prop === '--color-late') declaration.value = '#fedcba' })
      } }]
      const configured = master ? createPostCSSRequestPlugins(plugins, createNextPostCSSResourceHook({
        file: '/audit/entry.css', projectDir: '/audit', manifest: first.manifest,
        processedGlobals: first.emittedGlobals, resourceFiles: []
      })) : plugins
      const input = first.css + (master ? '' : '@layer theme{:root{--color-late:#abcdef}}')
      const result = await postcss(configured).process(input, { from: '/audit/entry.css' })
      counts.push(once)
      return result
    }
    const master = await run(true), pure = await run(false)
    expect(declarations(master.root)).toEqual(declarations(pure.root))
    expect(counts).toEqual([1, 1])
    expect(declarations(master.root).filter(([prop]) => prop === '--color-late')).toEqual([['--color-late', '#fedcba']])
    const old = declarations(master.root).filter(([prop]) => prop === '--color-old')
    expect(old).toEqual(mutation === 'edit' ? [['--color-old', '#123456']] : [])
    expect(master.root.masterCSSProcessedGlobals.variables['color-old']).toBeGreaterThan(0)
    expect(master.root.masterCSSProcessedGlobals.variables['color-late']).toBeGreaterThan(0)
  })
}

test('new globals carry ownership and root history prevents child re-emission', async () => {
  const first = await compileRenderedStylesheet('/audit/entry.css', source, { baseManifest })
  const policy = { file: '/audit/entry.css', projectDir: '/audit', manifest: first.manifest, processedGlobals: first.emittedGlobals, resourceFiles: [] }
  const root = postcss.parse(first.css + '.late{color:var(--color-late)}')
  const hook = createNextPostCSSResourceHook(policy)
  await postcss(createPostCSSRequestPlugins([], hook)).process(root, { from: policy.file })
  const late: { masterCSSGlobal?: boolean }[] = []
  root.walkDecls('--color-late', (node: { masterCSSGlobal?: boolean }) => late.push(node))
  expect(late).toHaveLength(1)
  expect(late[0].masterCSSGlobal).toBe(true)
  const child = postcss.parse('.child{color:var(--color-late)}')
  await postcss(createPostCSSRequestPlugins([], createNextPostCSSResourceHook({ ...policy,
    file: '/audit/child.css', processedGlobals: root.masterCSSProcessedGlobals
  }))).process(child, { from: '/audit/child.css' })
  expect(child.toString()).not.toContain('--color-late:')
})

test('allocated resource rebasing preserves query and fragment; other file identities stay opaque', () => {
  const output = rebasePostCSSResources('.a{background:url("file:///audit/image%20one.svg?rev=1#shape");mask:url("file:///unallocated.svg")}', '/audit/sub/entry.css', [['file:///audit/image%20one.svg', '/audit/image one.svg']])
  expect(output).toContain('./../image%20one.svg?rev=1#shape')
  expect(output).toContain('file:///unallocated.svg')
})

test('sibling roots share only the entry history: each emits an identical late definition once', async () => {
  const first = await compileRenderedStylesheet('/audit/entry.css', source, { baseManifest })
  const entry = postcss.parse(first.css)
  await postcss(createPostCSSRequestPlugins([], createNextPostCSSResourceHook({ file: '/audit/entry.css', projectDir: '/audit', manifest: first.manifest, processedGlobals: first.emittedGlobals, resourceFiles: [] }))).process(entry, { from: '/audit/entry.css' })
  const outputs = await Promise.all(['a', 'b'].map(async name => {
    const root = postcss.parse(`.${name}{color:var(--color-late)}`)
    await postcss(createPostCSSRequestPlugins([], createNextPostCSSResourceHook({
      file: `/audit/${name}.css`, projectDir: '/audit', manifest: first.manifest, processedGlobals: entry.masterCSSProcessedGlobals, resourceFiles: []
    }))).process(root, { from: `/audit/${name}.css` })
    return root.toString()
  }))
  for (const output of outputs) expect(output.match(/--color-late:#abcdef/g)).toHaveLength(1)
  expect(entry.toString()).not.toContain('--color-late')
})
