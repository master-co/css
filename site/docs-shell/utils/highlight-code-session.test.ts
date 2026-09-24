import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import highlightCode from './highlight-code'

const manifest: MasterCSSManifest = {
  version: 1,
  utilities: [{
    id: '.brand', name: 'brand', type: -2,
    emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
    matchers: [{ type: 'static', name: 'brand' }]
  }]
}

test('reused default sessions return independent trees and retain custom transformers', async () => {
  const code = '<div class="block fg:red invalid block"></div>'
  const options = { lang: 'html' }
  const first = await highlightCode(code, options)
  const expected = structuredClone(first)
  first.children.length = 0
  assert.deepEqual(await highlightCode(code, options), expected)
  const transformed = await highlightCode(code, {
    ...options,
    transformers: [{ code(node) { node.properties['data-test'] = 'custom' } }]
  })
  assert.match(JSON.stringify(transformed), /data-test/)
  assert.deepEqual(await highlightCode(code, options), expected)
})

test('custom manifests are isolated and caller-owned sessions remain usable', async () => {
  const code = '<div class="brand"></div>'
  const options = { lang: 'html', masterCSS: { manifest } }
  const custom = await highlightCode(code, options)
  const empty = await highlightCode(code, { lang: 'html', masterCSS: { manifest: { version: 1 } } })
  assert.notDeepEqual(custom, empty)
  assert.deepEqual(await highlightCode(code, options), custom)
  const session = createLanguageSessionSync({ manifest })
  let classifications = 0
  try {
    const supplied = {
      analyzeDocument: session.analyzeDocument,
      classifyClassNames(classes: readonly string[]) {
        classifications++
        return session.classifyClassNames(classes)
      }
    }
    assert.deepEqual(await highlightCode(code, { lang: 'html', masterCSS: { session: supplied } }), custom)
    assert.equal(classifications, 1)
    assert.equal(session.classifyClassNames(['brand']).classes[0].kind, 'semantic')
  } finally {
    session.dispose()
  }
})
