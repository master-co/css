import assert from 'node:assert/strict'
import { test } from 'node:test'
import { markdownTree } from '@master/internal-site/utils/markdown-tree'
import { documentExampleEnd } from './code-block'

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
