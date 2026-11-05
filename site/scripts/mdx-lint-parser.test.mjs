import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseForESLint } from './mdx-lint-parser.mjs'

test('localized metadata leaves the MDX body available to lint at its original source locations', () => {
  const metadata = '---\n{"title":"指南","figures":{"demo":{"alt":"{value}"}}}\n---\n\n'
  const result = parseForESLint(metadata + '<div class="p-md">Example</div>', { filePath: '/fixture/content.tw.mdx' })
  const classToken = result.ast.tokens.find(token => token.value === JSON.stringify('p-md'))
  assert.ok(classToken)
  assert.equal(classToken.loc.start.line, 5)
  assert.ok(classToken.range[0] >= metadata.length)
  assert.throws(() => parseForESLint(metadata + '<div class={}>', { filePath: '/fixture/content.tw.mdx' }))
})
