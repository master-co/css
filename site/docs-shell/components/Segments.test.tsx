import '../../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'

const { default: Segments } = await import('./Segments')

test('related views expose every source panel and stable tab-to-panel relationships in server HTML', () => {
  const html = renderToStaticMarkup(<Segments label="Transfer size">{[
    { name: 'Raw', content: <p>100 kB uncompressed</p> },
    { name: 'Brotli', content: <p>24 kB compressed</p> }
  ]}</Segments>)
  assert.match(html, /role="tablist" aria-label="Transfer size"/)
  assert.ok(html.includes('100 kB uncompressed'))
  assert.ok(html.includes('24 kB compressed'))
  const tabs = [...html.matchAll(/<button[^>]+role="tab"[^>]+>/g)].map(match => match[0])
  const panels = [...html.matchAll(/<div[^>]+role="tabpanel"[^>]+>/g)].map(match => match[0])
  assert.equal(tabs.length, 2)
  assert.equal(panels.length, 2)
  assert.match(tabs[0], /aria-selected="true" tabindex="0"/)
  assert.match(tabs[1], /aria-selected="false" tabindex="-1"/)
  assert.doesNotMatch(panels[0], /hidden/)
  assert.match(panels[1], /hidden=""/)
  for (let index = 0; index < tabs.length; index++) {
    const tabId = tabs[index].match(/\bid="([^"]+)"/)?.[1]
    const panelId = tabs[index].match(/aria-controls="([^"]+)"/)?.[1]
    assert.ok(panels[index].includes(`id="${panelId}"`))
    assert.ok(panels[index].includes(`aria-labelledby="${tabId}"`))
  }
})
