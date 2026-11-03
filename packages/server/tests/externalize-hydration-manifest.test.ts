import { describe, expect, it } from 'vitest'
import { externalizeHydrationManifest } from '../src'

const style = '<style id="master-css">.a{}</style>'
const script = '<script type="application/json" id="master-css-hydration-manifest">{"version":5}</script>'

describe('externalizeHydrationManifest', () => {
  it('moves the inline manifest into the style source attribute', () => {
    const result = externalizeHydrationManifest(`<html><head>${style}${script}</head><body></body></html>`, (json) => {
      expect(json).toBe('{"version":5}')
      return '/m.json?a=1&b="2"'
    })
    expect(result?.json).toBe('{"version":5}')
    expect(result?.html).toBe('<html><head><style id="master-css" data-master-css-hydration-manifest="/m.json?a=1&amp;b=&quot;2&quot;">.a{}</style></head><body></body></html>')
  })

  it('replaces an existing source attribute', () => {
    const html = `<style id="master-css" data-master-css-hydration-manifest="/old.json"></style>${script}`
    expect(externalizeHydrationManifest(html, () => '/new.json')?.html)
      .toBe('<style id="master-css" data-master-css-hydration-manifest="/new.json"></style>')
  })

  it('leaves pages without a valid inline manifest untouched', () => {
    expect(externalizeHydrationManifest(`<head>${style}</head>`, () => '/m.json')).toBeUndefined()
    expect(externalizeHydrationManifest(`<head>${script}</head>`, () => '/m.json')).toBeUndefined()
    expect(externalizeHydrationManifest(
      `<head>${style}<script id="master-css-hydration-manifest">{</script></head>`,
      () => '/m.json'
    )).toBeUndefined()
  })

  it('only edits real elements, not lookalike markup inside attribute values', () => {
    const body = '<img alt="x<script id=\'master-css-hydration-manifest\'>" src="a.png"><script>console.log(1)</script>'
      + '<img alt=" src=x onerror=alert(1) x=" src="b.png">'
    const result = externalizeHydrationManifest(`<html><head>${style}${script}</head><body>${body}</body></html>`, () => '/m.json')
    expect(result?.html).toBe(`<html><head><style id="master-css" data-master-css-hydration-manifest="/m.json">.a{}</style></head><body>${body}</body></html>`)
  })

  it('rebuilds the style tag from its attributes, not from lookalike text in other values', () => {
    const html = `<head><style title='a data-master-css-hydration-manifest=x"' id="master-css"></style>${script}</head>`
    expect(externalizeHydrationManifest(html, () => '/m.json')?.html)
      .toBe('<head><style title="a data-master-css-hydration-manifest=x&quot;" id="master-css" data-master-css-hydration-manifest="/m.json"></style></head>')
  })

  it('ignores placeholders inside foreign and raw-text containers', () => {
    const html = `<head>${style}</head><body><svg><style id="master-css"></style>${script}</svg></body>`
    expect(externalizeHydrationManifest(html, () => '/m.json')).toBeUndefined()
  })
})
