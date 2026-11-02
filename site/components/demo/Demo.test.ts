import '../../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { compile } from 'svelte/compiler'

// Node evaluates Svelte components without the Astro/Vite bundler: compile them for the server and resolve the site alias.
const siteRoot = new URL('../../', import.meta.url)
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('~/site/')) return nextResolve(new URL(specifier.slice('~/site/'.length), siteRoot).href, context)
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (!url.endsWith('.svelte')) return nextLoad(url, context)
    const filename = fileURLToPath(url)
    const { js } = compile(readFileSync(filename, 'utf8'), { filename, generate: 'server', runes: true })
    return { format: 'module', source: js.code, shortCircuit: true }
  }
})

const { createRawSnippet } = await import('svelte')
const { render } = await import('svelte/server')
const { default: Demo } = await import(import.meta.resolve('@master/internal-site/demo/Demo.svelte'))
const { default: DemoGeneratedCSS } = await import(import.meta.resolve('@master/internal-site/demo/DemoGeneratedCSS.svelte'))

/** Markup without Svelte's hydration comments. */
const markup = (component: any, props: Record<string, unknown>) => render(component, { props }).body.replace(/<!--[\s\S]*?-->/g, '')
const html = (value: string) => createRawSnippet(() => ({ render: () => value }))

test('one example is one tray with a plain, centered stage by default', () => {
  assert.equal(markup(Demo, { children: html('<span>Subject</span>') }), '<figure class="ui-tray"><div class="ui-stage"><span>Subject</span></div></figure>')
  const pattern = markup(Demo, { background: 'checkerboard', padding: 'sm', align: 'start', children: html('<span>Transparent artwork</span>') })
  assert.match(pattern, /<div class="ui-stage" data-background="checkerboard" data-padding="sm" data-align="start">/)
})

test('head, stage, source and caption keep their order; stage geometry stays on the stage', () => {
  const generated = markup(DemoGeneratedCSS, { children: html('<pre>.flex {display:flex}</pre>') })
  const output = markup(Demo, {
    padding: 'none', title: 'Measured subject', caption: 'A real width', controls: html('<button type="button">Reset</button>'),
    id: 'example', frameClassName: 'example-frame', class: 'flex w(240)', style: { gap: 12, overflow: 'visible' },
    source: html(generated), children: html('<div style="width:40px;height:60px">Subject</div>')
  })
  const outer = output.match(/^<figure[^>]+>/)?.[0] ?? ''
  const stage = output.match(/<div class="ui-stage[^>]+>/)?.[0] ?? ''
  assert.equal(outer, '<figure id="example" class="ui-tray example-frame">')
  assert.equal(stage, '<div class="ui-stage flex w(240)" style="gap:12px;overflow:visible" data-padding="none">')
  const order = ['ui-tray-head', 'Reset', 'ui-stage', '<details class="ui-disclosure">', 'ui-tray-caption'].map(part => output.indexOf(part))
  assert.deepEqual([...order].sort((a, b) => a - b), order)
  assert.ok(order.every(index => index >= 0))
  assert.doesNotMatch(output, /<details[^>]* open/)
  assert.match(output, /<div class="ui-tray-caption">A real width<\/div><\/figure>$/)
})

test('a frameless tray holds content that owns its frame, and a lone caption names the figure', () => {
  const output = markup(Demo, { frame: 'none', caption: 'Browser chrome', children: html('<div class="ui-browser"></div>') })
  assert.equal(output, '<figure class="ui-tray"><div class="ui-browser"></div><figcaption class="ui-tray-caption">Browser chrome</figcaption></figure>')
})
