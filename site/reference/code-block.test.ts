import assert from 'node:assert/strict'
import { test } from 'node:test'
import { markdownTree } from '@master/internal-site/utils/markdown-tree'
import { documentExampleEnd } from './code-block'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractReferenceMdx, portableMarkdown } from './markdown'
import { deliveryGuideContent } from '../utils/delivery-content'
import { syntaxTutorialContent } from '../utils/syntax-tutorial'

const siteRoot = fileURLToPath(new URL('../', import.meta.url))

const source = '```css\n@mixin --inset { padding: 1.5rem; }\n```\n\n```html\n<div class="card p(8)">Example</div>\n```\n\n```css disclosure=generated-css\n.p\\(8\\){padding:calc(8 * 1px)}\n```'

test('only explicit author boundaries group configuration, markup and generated output', () => {
  const nodes = markdownTree(`<!-- document-example -->\n\n${source}\n\n<!-- /document-example -->\n\nUnrelated prose.`).children
  assert.equal(documentExampleEnd(nodes, 0), 4)
  assert.equal(nodes.slice(1, 4).filter(node => node.type === 'code').length, 3)
  const ungrouped = markdownTree(source).children
  assert.equal(documentExampleEnd(ungrouped, 0), undefined)
})

test('malformed boundaries fail instead of swallowing unrelated document content', () => {
  assert.throws(() => documentExampleEnd(markdownTree(`<!-- document-example -->\n\n${source}`).children, 0), /Unclosed/)
  assert.throws(() => documentExampleEnd(markdownTree('<!-- document-example -->\n\n<!-- /document-example -->').children, 0), /Empty/)
  assert.throws(() => documentExampleEnd(markdownTree('<!-- document-example -->\n\nUnrelated prose.\n\n<!-- /document-example -->').children, 0), /explicit code blocks/)
  assert.throws(() => documentExampleEnd(markdownTree('<!-- document-example -->\n\n<!-- document-example -->\n\n<!-- /document-example -->').children, 0), /explicit code blocks/)
  assert.throws(() => documentExampleEnd(markdownTree('<!-- /document-example -->').children, 0), /Unexpected/)
})

test('the reviewed inventory distinguishes semantic examples from standalone lookups in every edition', async () => {
  const inventory = JSON.parse(await readFile(path.join(siteRoot, 'tests/document-example-inventory.json'), 'utf8'))
  assert.equal(inventory.length, 76)
  assert.equal(inventory.filter((item: any) => item.classification === 'standalone-compiled-query').length, 28)
  for (const item of inventory.filter((item: any) => item.component === 'Class2CSS')) {
    for (const locale of ['', '.tw', '.ja', '.ko', '.cn']) {
      const file = path.join(siteRoot, item.path.replace(/^site\//, '').replace(/\.mdx$/, `${locale}.mdx`))
      const source = await readFile(file, 'utf8')
      const occurrence = [...source.matchAll(/<Class2CSS\b/g)][item.ordinal - 1]
      assert.ok(occurrence, `${file}: query ${item.ordinal} exists`)
      const before = source.slice(0, occurrence.index)
      const grouped = before.lastIndexOf('<DocumentExample>') > before.lastIndexOf('</DocumentExample>')
      assert.equal(grouped, item.classification === 'explicit-source-output', `${file}: query ${item.ordinal} relationship`)
      if (!grouped) assert.ok(item.reason, 'Every independent query has a reviewed semantic reason')
    }
  }
})

test('prose-separated examples retain complete ordered sources and output through normalization', async () => {
  const cases = [
    ['class-extraction', 'contract', ['card p-md shadow-md']],
    ['conditional-queries', 'contract', ['fg-red:hover@sm']],
    ['rendering-modes', 'content', ['font-5xl', 'createServerRenderer']],
    ['scanning-and-pruning', 'content', ["error ? 'bg-red-60'", 'const statusClasses']],
    ['syntax-tutorial', 'content', ['fg-blue-60:hover@sm']]
  ] as const
  for (const [slug, basename, sources] of cases) for (const locale of ['en', 'tw', 'ja', 'ko', 'cn']) {
    const file = path.join(siteRoot, `content/guide/${slug}/${basename}${locale === 'en' ? '' : `.${locale}`}.mdx`)
    const content = slug === 'syntax-tutorial' ? await syntaxTutorialContent(siteRoot, locale)
      : ['rendering-modes', 'scanning-and-pruning'].includes(slug) ? await deliveryGuideContent(siteRoot, slug, locale)
      : await extractReferenceMdx(file)
    const normalized = 'searchMarkdown' in content ? content.searchMarkdown : content.markdown
    assert.ok(typeof normalized === 'string')
    const groups = [...normalized.matchAll(/<!-- document-example -->\n([\s\S]*?)<!-- \/document-example -->/g)]
    const group = groups.find(match => match[1].includes(sources[0]))?.[1]
    assert.ok(group, `${slug}/${locale}: the same example is explicitly grouped across its former prose separator`)
    const nodes = markdownTree(`<!-- document-example -->\n${group}<!-- /document-example -->`).children
    assert.equal(documentExampleEnd(nodes, 0), sources.length + 2)
    const fences = nodes.filter(node => node.type === 'code')
    sources.forEach((source, index) => assert.ok(fences[index].value.includes(source), `${slug}/${locale}: source order ${index}`))
    assert.match(fences.at(-1)!.meta!, /disclosure=generated-css/)
    assert.doesNotMatch(group, /reference-illustration|DeliveryFlow|SyntaxIllustration/, 'Teaching figures stay independent')
    assert.doesNotMatch(portableMarkdown(normalized), /<!-- \/?document-example -->/)
    assert.deepEqual(content.notes, [])
  }
})
