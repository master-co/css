import assert from 'node:assert/strict'
import { test } from 'node:test'
import { markdownTree } from '@master/internal-site/utils/markdown-tree'
import { createReferenceCopyLoader, referenceCopy, referenceCopyResources, referenceEditorial, requiredReferenceContracts, referenceText } from './copy'
import { tokenPages } from './sheet-editorial'
import { tokenSheet } from './sheets'
import { referenceTable } from './reference-body'
import { localizeReferenceMarkdown, readRequiredReferenceContract } from './build'
import { extractReferenceMdx } from './markdown'
import { documentHeadings } from './headings'
import { fileURLToPath } from 'node:url'
import { buildTokenContracts } from './token-contracts'
import { buildRecipeContracts } from './recipes'
import { fixedUtilitiesMarkdown, fixedUtilityRows } from './fixed-utilities'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { ruleSources } from './editorial'

async function writeRequiredContracts(siteRoot: string) {
  for (const relative of requiredReferenceContracts) {
    const file = path.join(siteRoot, 'content', relative)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, '## Published contract\n')
    await writeFile(file.replace(/\.mdx$/, '.tw.mdx'), '## 已發布契約\n')
  }
}

test('local Reference prose preserves one semantic sheet across all five languages', () => {
  const original = tokenPages.find(page => page.id === 'color')!
  const baseline = tokenSheet(original)
  const titles = new Set<string>()
  for (const locale of ['en', 'tw', 'ja', 'ko', 'cn']) {
    const localized = referenceEditorial(original, 'tokens/color', locale)
    const sheet = tokenSheet(localized, locale)
    titles.add(sheet.title)
    assert.deepEqual(sheet.syntax, baseline.syntax)
    assert.deepEqual(sheet.groups.map(group => group.values), baseline.groups.map(group => group.values))
    for (const example of ['usage', 'customize'] as const) {
      assert.equal(sheet[example].html, baseline[example].html)
      assert.equal(sheet[example].css, baseline[example].css)
    }
    assert.equal(localized.title, referenceText('tokens/color', 'title', locale))
  }
  assert.equal(titles.size, 5)
  assert.equal(original.title, referenceText('tokens/color', 'title'))
})

test('a missing resource or section cannot fall back to English', () => {
  assert.throws(() => referenceCopy('does-not-exist', 'tw'), /ENOENT/)
  assert.throws(() => referenceText('tokens/color', 'does-not-exist', 'tw'), /Missing Reference prose/)
})

test('required Reference prose rejects source and locale drafts after warming its cache', async () => {
  const siteRoot = await mkdtemp(path.join(tmpdir(), 'reference-draft-'))
  const contentRoot = path.join(siteRoot, 'reference/content')
  const directory = path.join(contentRoot, 'fixture')
  const source = path.join(directory, 'content.mdx')
  const translation = path.join(directory, 'content.tw.mdx')
  const document = (text: string, draft = false) => `---\ndraft: ${draft}\n---\n## title \\{#copy-title\\}\n\n${text}\n`
  try {
    await mkdir(directory, { recursive: true })
    await writeRequiredContracts(siteRoot)
    await writeFile(source, document('Published source'))
    await writeFile(translation, document('已發布譯文'))
    const load = createReferenceCopyLoader(contentRoot)
    const cached = load('fixture', 'tw')
    assert.equal(cached.title, '已發布譯文')
    assert.equal(load('fixture', 'tw'), cached)
    assert.equal(referenceCopyResources(siteRoot, ['en', 'tw'])[0].draft, undefined)

    await writeFile(source, document('Private source', true))
    assert.throws(() => load('fixture', 'tw'), /Required Reference document cannot be a draft:.*content\.mdx/)
    assert.throws(() => load('fixture'), /Required Reference document cannot be a draft/)
    assert.throws(() => referenceCopyResources(siteRoot, ['en', 'tw']), /Required Reference document cannot be a draft/)

    await writeFile(source, document('Published source again'))
    assert.equal(load('fixture', 'tw').title, '已發布譯文')
    await writeFile(translation, document('私人譯文', true))
    assert.throws(() => load('fixture', 'tw'), /Required Reference document cannot be a draft:.*content\.tw\.mdx/)
    assert.throws(() => referenceCopyResources(siteRoot, ['en', 'tw']), /Required Reference document cannot be a draft/)
    assert.equal(load('fixture').title, 'Published source again')

    await writeFile(translation, document('重新發布的譯文'))
    assert.equal(load('fixture', 'tw').title, '重新發布的譯文')
    assert.ok(referenceCopyResources(siteRoot, ['en', 'tw'])[0].translations.tw?.includes('重新發布的譯文'))
  } finally {
    await rm(siteRoot, { recursive: true, force: true })
  }
})

test('the native translation inventory rejects required contract drafts before prepared payloads can publish them', async () => {
  assert.deepEqual([...requiredReferenceContracts].sort(), [...ruleSources.map(rule => rule.source), 'guide/directives/contract.mdx'].sort())
  const siteRoot = await mkdtemp(path.join(tmpdir(), 'reference-contract-inventory-'))
  try {
    await mkdir(path.join(siteRoot, 'reference/content'), { recursive: true })
    await writeRequiredContracts(siteRoot)
    assert.ok(referenceCopyResources(siteRoot, ['en', 'tw']).length)
    for (const relative of requiredReferenceContracts) {
      const source = path.join(siteRoot, 'content', relative)
      const translation = source.replace(/\.mdx$/, '.tw.mdx')
      await writeFile(source, '---\ndraft: true\n---\n## Private contract\n')
      assert.throws(() => referenceCopyResources(siteRoot, ['en', 'tw']), /Required Reference document cannot be a draft/)
      await writeFile(source, '## Published contract\n')
      await writeFile(translation, '---\ndraft: true\n---\n## 私人契約\n')
      assert.throws(() => referenceCopyResources(siteRoot, ['en', 'tw']), /Required Reference document cannot be a draft/)
      await writeFile(translation, '## 已發布契約\n')
    }
    assert.ok(referenceCopyResources(siteRoot, ['en', 'tw']).length)
  } finally {
    await rm(siteRoot, { recursive: true, force: true })
  }
})

test('required Reference contracts reject a draft source in every locale and a draft selected edition', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'reference-contract-draft-'))
  const source = path.join(directory, 'contract.mdx')
  const translation = path.join(directory, 'contract.tw.mdx')
  const document = (text: string, draft = false) => `---\ndraft: ${draft}\n---\n## Contract \\{#contract\\}\n\n${text}\n`
  try {
    await writeFile(source, document('Published contract'))
    await writeFile(translation, document('已發布契約'))
    assert.ok((await readRequiredReferenceContract(source, 'tw')).content.includes('已發布契約'))
    await writeFile(source, document('Private contract', true))
    for (const locale of ['en', 'tw', 'ja', 'ko', 'cn']) {
      await assert.rejects(readRequiredReferenceContract(source, locale), /Required Reference document cannot be a draft:.*contract\.mdx/)
    }
    await writeFile(source, document('Published contract again'))
    await writeFile(translation, document('私人契約', true))
    await assert.rejects(readRequiredReferenceContract(source, 'tw'), /Required Reference document cannot be a draft:.*contract\.tw\.mdx/)
    assert.ok((await readRequiredReferenceContract(source)).content.includes('Published contract again'))
    await assert.rejects(readRequiredReferenceContract(source, 'ja'), /Missing localized document/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('structured Reference tables do not depend on their visible header language', () => {
  const table = (markdown: string) => markdownTree(markdown).children.find(node => node.type === 'table')!
  for (const heading of ['Namespace | Consumers', '命名空間 | 使用者', '名前空間 | 参照元', '네임스페이스 | 소비자', '命名空间 | 使用者']) {
    const shape = referenceTable(table(`| ${heading} |\n| --- | --- |\n| \`--spacing-*\` | \`p-\`, \`gap-\` |`))
    assert.equal(shape.kind, 'namespace')
  }
  const values = referenceTable(table('| Token | Class | Declaration |\n| --- | --- | --- |\n| `--x` | `x` | `width:var(--x)` |'))
  assert.equal(values.kind, 'table', 'three code columns are facts, not project options')
})

test('portable locale links preserve fragments and keep fenced example code verbatim', () => {
  const source = '[Theme](/reference/directives/theme#theme)\n[Guide](/guide?q=layout)\n[Brand](https://master.co/brand/master-css#color)\n[CSS](https://css.master.co/guide/theme)\n[Image](https://master.co/assets/logo.svg)\n[External](https://example.com/guide)\n\n```html\n<a href="/guide">Guide</a>\n```'
  const localized = localizeReferenceMarkdown(source, 'tw')
  assert.ok(localized.includes('](/tw/reference/directives/theme#theme)'))
  assert.ok(localized.includes('](/tw/guide?q=layout)'))
  assert.ok(localized.includes('<a href="/guide">Guide</a>'))
  assert.ok(localized.includes('](https://master.co/tw/brand/master-css#color)'))
  assert.ok(localized.includes('](https://css.master.co/tw/guide/theme)'))
  assert.ok(localized.includes('](https://master.co/assets/logo.svg)'))
  assert.ok(localized.includes('](https://example.com/guide)'))
})

test('portable links distinguish nested fences, inline code, definitions and autolinks', () => {
  const source = '````md\n```\n[Code](/guide)\n```\n````\n\n`[Inline](/guide)`\n\n[Reference][ref]\n\n[ref]: /reference/tokens/color.md "Colors"\n\n<https://master.co/brand>\n\n[Asset](/guide.png)'
  const localized = localizeReferenceMarkdown(source, 'ja')
  assert.ok(localized.includes('[Code](/guide)'))
  assert.ok(localized.includes('`[Inline](/guide)`'))
  assert.ok(localized.includes('[ref]: /ja/reference/tokens/color.md "Colors"'))
  assert.ok(localized.includes('<https://master.co/ja/brand>'))
  assert.ok(localized.includes('[Asset](/guide.png)'))
})

test('translated contracts keep stable anchors and identical executable examples', async () => {
  for (const slug of ['cascade-layers', 'class-extraction', 'variable-modes', 'conditional-queries', 'style-declarations', 'state-selectors', 'directives']) {
    const directory = new URL(`../content/guide/${slug}/`, import.meta.url)
    const source = await extractReferenceMdx(fileURLToPath(new URL('contract.mdx', directory)))
    const facts = (examples: typeof source.examples) => examples.map(({ classes, css, configuration }) => ({ classes, css, configuration }))
    for (const locale of ['tw', 'ja', 'ko', 'cn']) {
      const localized = await extractReferenceMdx(fileURLToPath(new URL(`contract.${locale}.mdx`, directory)))
      assert.deepEqual(localized.notes, [])
      assert.deepEqual(facts(localized.examples), facts(source.examples))
      assert.deepEqual(documentHeadings(localized.markdown).map(heading => heading.id), documentHeadings(source.markdown).map(heading => heading.id))
      assert.notEqual(localized.markdown, source.markdown)
    }
  }
})

test('every token and recipe edition retains the same complete facts and generated CSS', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const source = [...buildTokenContracts(), ...await buildRecipeContracts(root)]
  for (const locale of ['tw', 'ja', 'ko', 'cn']) {
    const documents = [...buildTokenContracts(locale), ...await buildRecipeContracts(root, locale)]
    assert.deepEqual(documents.map(doc => doc.id), source.map(doc => doc.id))
    for (const [index, doc] of documents.entries()) {
      assert.equal(doc.locale, locale)
      assert.deepEqual(doc.headings.map(heading => heading.id), source[index].headings.map(heading => heading.id))
      assert.deepEqual(doc.examples.map(({ classes, css, configuration }) => ({ classes, css, configuration })), source[index].examples.map(({ classes, css, configuration }) => ({ classes, css, configuration })))
    }
  }
})

test('the fixed-utility lookup is one generated fact table in every authored edition', async () => {
  assert.equal(fixedUtilityRows.length, 292)
  assert.equal(new Set(fixedUtilityRows.map(row => row.className)).size, 292)
  const declarations = Object.fromEntries(fixedUtilityRows.map(row => [row.className, row.declaration]))
  assert.equal(declarations.hidden, 'display: none')
  assert.equal(declarations['size-x-full'], 'inline-size: 100%')
  assert.equal(declarations['b-none'], 'border-style: none')
  assert.equal(declarations['select-none'], 'user-select: none', 'vendor compatibility output does not replace the authored property')
  const rows = fixedUtilitiesMarkdown().split('\n').slice(2)
  for (const locale of ['en', 'tw', 'ja', 'ko', 'cn']) {
    const suffix = locale === 'en' ? '' : `.${locale}`
    const file = new URL(`../content/guide/style-declarations/contract${suffix}.mdx`, import.meta.url)
    const source = await readFile(file, 'utf8')
    assert.equal(source.match(/<FixedUtilities \/>/g)?.length, 1)
    assert.ok(source.includes('{#fixed-utilities'))
    assert.ok(!source.includes('| `display` |'))
    assert.deepEqual(fixedUtilitiesMarkdown(locale).split('\n').slice(2), rows)
  }
})
