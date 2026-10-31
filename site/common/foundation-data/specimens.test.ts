import assert from 'node:assert/strict'
import { test } from 'node:test'
import { foundationTokens, namespaceTokens } from './tokens'
import { foundationScene, specimenTokens, primaryTokens, defaultValue } from './specimens'
import { selectedSpecimensMarkdown } from './specimen-content'
import { configuredExampleCSS, configuredMarkupClasses } from '../../reference/configured-example'
import { demoDocument } from '../../components/demo/reference/document'

const section = (id: string) => ({ page: 'foundation-test', id, title: id, html: [], css: '', classes: [], classLists: [], highlighted: [] })

test('every non-palette preset specimen compiles against the public engine, with complete primary coverage', () => {
  for (const namespace of new Set(foundationTokens.map(token => token.namespace))) {
    if (!namespace || ['color', 'spacing'].includes(namespace)) continue
    const scene = foundationScene(namespace)
    const html = demoDocument(section(namespace), scene)
    for (const token of primaryTokens(namespaceTokens(namespace))) assert.ok(html.includes(`--${token.name}`), `${namespace}: ${token.name}`)
    assert.ok(scene.html.length > 0, namespace)
    assert.ok(configuredExampleCSS(scene.css ?? '', configuredMarkupClasses(scene.html)).length > 0)
  }
})
test('palette retains all 23 complete fixed hue rows, including the interface neutral, and separates aliases', () => {
  const groups = new Map<string, number[]>()
  for (const token of namespaceTokens('color')) {
    const match = token.key.match(/^(.+)-(\d+)$/)
    if (!match) continue
    assert.match(defaultValue(token), /^oklch\(/)
    groups.set(match[1], [...groups.get(match[1]) ?? [], Number(match[2])])
  }
  assert.equal(groups.size, 23)
  assert.ok(groups.has('zinc'))
  for (const steps of groups.values()) assert.deepEqual(steps, [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100])
})
test('selected Guide specimens and portable output preserve the same facts and meaningful comparison', () => {
  const selected = ['sm', 'lg']
  assert.deepEqual(specimenTokens('shadow', selected).map(token => token.key), selected)
  const output = selectedSpecimensMarkdown('shadow', selected)
  assert.match(output, /Standard surface/)
  assert.match(output, /Detached overlay/)
  assert.doesNotMatch(output, /--shadow-2xl/)
  assert.throws(() => specimenTokens('radius', ['imaginary']))
  assert.doesNotMatch(selectedSpecimensMarkdown('color', ['yellow']), /[Cc]opy/)
  assert.match(selectedSpecimensMarkdown('color', ['yellow']), /fixed swatch/)
})
test('text, line and leading specimens show their actual effect; radius shows only scale tokens', () => {
  assert.match(foundationScene('color-text', ['body']).html, /data-role-preview="text"[^>]+fg-text-body/)
  assert.match(foundationScene('color-line', ['control']).html, /data-role-preview="line"[^>]+border-style:solid[^>]+b-line-control/)
  assert.ok(foundationScene('leading').html.includes('from one line to the next'))
  // Pill is a fixed utility, and the preset has no order tokens.
  assert.doesNotMatch(foundationScene('radius').html, /pill/)
  assert.equal(namespaceTokens('order').length, 0)
})
test('motion is managed and uses actual per-token duration or timing values', () => {
  for (const namespace of ['animate', 'duration', 'easing']) {
    const scene = foundationScene(namespace)
    assert.equal(scene.motion, true)
    assert.match(demoDocument(section(namespace), scene), /data-demo-paused/)
    assert.match(scene.css!, /prefers-reduced-motion:reduce/)
    if (namespace !== 'animate') for (const token of namespaceTokens(namespace)) assert.ok(scene.html.includes(`var(--${token.name})`))
  }
})
