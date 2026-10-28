import '../../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'

const { default: Demo } = await import('./Demo')

test('a neutral canvas is the default, with explicit patterns still available', () => {
  const html = renderToStaticMarkup(<Demo><span>Subject</span></Demo>)
  assert.match(html, /class="site-demo" data-frame="default"/)
  assert.match(html, /class="demo-canvas" data-background="plain" data-padding="lg"/)
  const pattern = renderToStaticMarkup(<Demo background="checkerboard"><span>Transparent artwork</span></Demo>)
  assert.match(pattern, /data-background="checkerboard"/)
})

test('a composed frameless example retains canvas geometry and keeps chrome outside it', () => {
  const html = renderToStaticMarkup(<Demo frame="none" padding="none" title="Measured subject" caption="A real width" controls={<button type="button">Reset</button>}
    id="example" frameClassName="example-frame" className="display:flex width:240px" style={{ gap: 12, overflow: 'visible' }}>
    <div style={{ width: 40, height: 60 }}>Subject</div>
  </Demo>)
  const outer = html.match(/^<div[^>]+>/)?.[0] ?? ''
  const canvas = html.match(/<div class="demo-canvas[^>]+>/)?.[0] ?? ''
  assert.match(outer, /id="example"/)
  assert.match(outer, /class="site-demo example-frame" data-frame="none"/)
  assert.doesNotMatch(outer, /style=|width:240px|padding=/)
  assert.match(canvas, /class="demo-canvas display:flex width:240px"/)
  assert.match(canvas, /data-padding="none"/)
  assert.match(canvas, /style="gap:12px;overflow:visible"/)
  assert.match(html, /<div style="width:40px;height:60px">Subject<\/div><\/div><div class="demo-caption">/)
  assert.ok(html.indexOf('Reset') < html.indexOf('class="demo-canvas'))
})
