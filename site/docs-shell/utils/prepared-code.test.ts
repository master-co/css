import assert from 'node:assert/strict'
import { test } from 'node:test'
import highlightCode from './highlight-code-core'
import { prepareCode } from './prepared-code'

test('prepared blocks escape displayed markup and preserve complete copy text', async () => {
  const source = '<script>window.unexpected = "<&>"</script>\n<img src="x" onerror="unexpected()">'
  const code = await prepareCode(await highlightCode(source, { lang: 'html', dedent: false }))
  assert.equal(code.text, source)
  assert.doesNotMatch(code.html, /<(?:script|img)\b/)
  assert.match(code.html, /(?:&lt;|&#x3[cC];|&#60;)/)
  assert.match(code.properties.className!, /code-wrapper scrollbar/)
  assert.equal(String(code.properties.tabIndex), '0')
  assert.ok(!('children' in code.properties))
})

test('prepared blocks preserve notation effects without copying their markers', async () => {
  const source = 'color: red; /* [!code ++] */'
  const code = await prepareCode(await highlightCode(source, { lang: 'css' }))
  assert.equal(code.text, 'color: red;')
  assert.match(code.html, /code-line-add/)
  assert.doesNotMatch(code.html, /\[!code/)
  await assert.rejects(prepareCode(await highlightCode('text', { lang: 'plaintext', inline: true })), /Expected one highlighted code block/)
})
