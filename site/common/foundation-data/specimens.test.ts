import assert from 'node:assert/strict'
import { test } from 'node:test'
import { foundationTokens, namespaceTokens } from './tokens'
import { foundationScene, specimenTokens, primaryTokens, defaultValue } from './specimens'
import { recipeSpecimens } from './recipe-specimens'
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
test('palette retains all 30 complete fixed hue rows and separates aliases', () => {
  const groups = new Map<string, number[]>()
  for (const token of namespaceTokens('color')) {
    const match = token.key.match(/^(.+)-(\d+)$/)
    if (!match) continue
    assert.match(defaultValue(token), /^oklch\(/)
    groups.set(match[1], [...groups.get(match[1]) ?? [], Number(match[2])])
  }
  assert.equal(groups.size, 30)
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
})
test('text, line, leading and order specimens show their actual effect', () => {
  assert.match(foundationScene('color-text', ['body']).html, /data-role-preview="text"[^>]+fg-text-body/)
  assert.match(foundationScene('color-line', ['control']).html, /data-role-preview="line"[^>]+border-style:solid[^>]+b-line-control/)
  assert.ok(foundationScene('leading').html.includes('from one line to the next'))
  const order = foundationScene('order')
  assert.ok(namespaceTokens('order').length > 0)
  assert.match(order.html, /order-first/)
  assert.match(configuredExampleCSS(order.css!, configuredMarkupClasses(order.html)), /order:var\(--order-first\)/)
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
test('seven recipe specimens preserve all seven mixins and visible native content', () => {
  assert.equal(Object.keys(recipeSpecimens).length, 7)
  for (const [id, scene] of Object.entries(recipeSpecimens)) {
    assert.doesNotMatch(scene.html, />Example</)
    assert.ok(demoDocument(section(id), scene).includes(scene.html), id)
  }
  assert.match(recipeSpecimens['screen-readers'].html, /<span class="sr-only">Add collection<\/span>/)
  assert.match(recipeSpecimens['grid-column'].html, /grid-col-span\(2\)/)
  assert.match(recipeSpecimens['clamp-lines'].html, /Complete paragraph/)
})
