import '../../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'

const { default: Demo, DemoGeneratedCSS } = await import('./Demo')

test('one example is one tray with a plain, centered stage by default', () => {
  const html = renderToStaticMarkup(<Demo><span>Subject</span></Demo>)
  assert.equal(html, '<figure class="ui-tray"><div class="ui-stage"><span>Subject</span></div></figure>')
  const pattern = renderToStaticMarkup(<Demo background="checkerboard" padding="sm" align="start"><span>Transparent artwork</span></Demo>)
  assert.match(pattern, /<div class="ui-stage" data-background="checkerboard" data-padding="sm" data-align="start">/)
})

test('head, stage, source and caption keep their order; stage geometry stays on the stage', () => {
  const html = renderToStaticMarkup(<Demo padding="none" title="Measured subject" caption="A real width" controls={<button type="button">Reset</button>}
    id="example" frameClassName="example-frame" className="flex (width:240px)" style={{ gap: 12, overflow: 'visible' }}
    source={<DemoGeneratedCSS><pre>.flex {'{'}display:flex{'}'}</pre></DemoGeneratedCSS>}>
    <div style={{ width: 40, height: 60 }}>Subject</div>
  </Demo>)
  const outer = html.match(/^<figure[^>]+>/)?.[0] ?? ''
  const stage = html.match(/<div class="ui-stage[^>]+>/)?.[0] ?? ''
  assert.equal(outer, '<figure id="example" class="ui-tray example-frame">')
  assert.equal(stage, '<div class="ui-stage flex (width:240px)" style="gap:12px;overflow:visible" data-padding="none">')
  const order = ['ui-tray-head', 'Reset', 'ui-stage', '<details class="ui-disclosure">', 'ui-tray-caption'].map(part => html.indexOf(part))
  assert.deepEqual([...order].sort((a, b) => a - b), order)
  assert.ok(order.every(index => index >= 0))
  assert.doesNotMatch(html, /<details[^>]* open/)
  assert.match(html, /<div class="ui-tray-caption">A real width<\/div><\/figure>$/)
})

test('a frameless tray holds content that owns its frame, and a lone caption names the figure', () => {
  const html = renderToStaticMarkup(<Demo frame="none" caption="Browser chrome"><div className="ui-browser" /></Demo>)
  assert.equal(html, '<figure class="ui-tray"><div class="ui-browser"></div><figcaption class="ui-tray-caption">Browser chrome</figcaption></figure>')
})
