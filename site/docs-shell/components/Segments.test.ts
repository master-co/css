import '../../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { compile } from 'svelte/compiler'
import { createRawSnippet } from 'svelte'
import { render } from 'svelte/server'

// Server-render Svelte components without the Astro/Vite bundler.
registerHooks({
  load(url, context, nextLoad) {
    if (!url.endsWith('.svelte')) return nextLoad(url, context)
    const filename = fileURLToPath(url)
    const { js } = compile(readFileSync(filename, 'utf8'), { filename, generate: 'server' })
    return { format: 'module', source: js.code, shortCircuit: true }
  }
})

const { default: Segments } = await import('./Segments.svelte')
const html = (markup: string) => createRawSnippet(() => ({ render: () => markup }))

test('related views expose every source panel and stable tab-to-panel relationships in server HTML', () => {
  const { body } = render(Segments, {
    props: {
      label: 'Transfer size',
      names: ['Raw', 'Brotli'],
      Raw: html('<p>100 kB uncompressed</p>'),
      Brotli: html('<p>24 kB compressed</p>')
    }
  })
  assert.match(body, /role="tablist" aria-label="Transfer size"/)
  assert.ok(body.includes('100 kB uncompressed'))
  assert.ok(body.includes('24 kB compressed'))
  const tabs = [...body.matchAll(/<button[^>]+role="tab"[^>]+>/g)].map(match => match[0])
  const panels = [...body.matchAll(/<div[^>]+role="tabpanel"[^>]+>/g)].map(match => match[0])
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
