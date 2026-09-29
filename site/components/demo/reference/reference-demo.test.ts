import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { referenceDemoSections } from './source'
import { referenceScenes } from './scenes'
import { demoDocument } from './document'

const root = new URL('../specimens/', import.meta.url)

test('every retained gallery specimen has a unique source and compilable scene', async () => {
  let count = 0
  const failures: string[] = []
  const files = (await readdir(root)).filter(file => file.endsWith('.json'))
  for (const file of files) {
    const page = file.slice(0, -5)
    assert.ok(referenceScenes[page], `No scene family for ${page}`)
    const sections = await referenceDemoSections(page)
    assert.ok(sections.length, `${page}: empty specimen collection`)
    assert.equal(new Set(sections.map(section => section.id)).size, sections.length, `${page}: duplicate specimen`)
    for (const section of sections) {
      assert.equal(section.page, page)
      try {
        const scene = referenceScenes[page](section)
        assert.ok(scene.caption.trim(), 'Every visual needs an explanation')
        assert.ok(scene.html.includes('data-target') || scene.html.includes('class='), 'A scene needs an actual CSS subject')
        const document = demoDocument(section, scene)
        assert.match(document, /@layer theme,base,defaults,components,utilities;/)
        assert.match(document, /--color-demo-text:/)
        assert.doesNotMatch(document, /<script\b|on(?:click|load|error)=/i)
        assert.doesNotMatch(document, /(?:src|url\()=['"]?(?:\.\.\.|\/hero\.jpg|\/mask\.png)/)
        count++
      } catch (error) { failures.push(`${page}#${section.id}: ${String(error)}`) }
    }
  }
  assert.deepEqual(failures, [])
  assert.ok(count >= 80, 'The retained gallery must exercise its full set of specimens')
})

test('clear uses different float heights and real side-specific clearing', async () => {
  const sections = await referenceDemoSections('clear')
  for (const side of ['left', 'right']) {
    const section = sections.find(value => value.id === `clearing-${side}-floats`)!
    const scene = referenceScenes.clear(section)
    const document = demoDocument(section, scene)
    assert.ok(document.includes(`clear:${side}`))
    assert.ok(document.includes('height:4.5rem'))
    assert.ok(document.includes('height:8.5rem'))
    assert.match(document, new RegExp(`clear:${side}`))
  }
})

test('native demo rules retain theme variables used without utility classes', () => {
  const html = '<div class="native-card">Preview</div>'
  const document = demoDocument({
    page: 'project-styles', id: 'native-card', title: 'Native card', html: [html],
    css: '.native-card { background-color: var(--color-blue-60); border-radius: var(--radius-md); }',
    classes: [], classLists: [], highlighted: []
  }, { html, caption: 'Native theme references' })
  assert.match(document, /\.native-card\s*\{[^}]*var\(--color-blue-60\)/)
  assert.match(document, /--color-blue-60:/)
  assert.match(document, /--radius-md:/)
})

test('new demo tokens are defined and specimens do not force layout on demo items', async () => {
  const css = await readFile(new URL('../../../styles/demo.css', import.meta.url), 'utf8')
  const theme = await readFile(new URL('../../../styles/demo-theme.css', import.meta.url), 'utf8')
  const itemRule = css.match(/:where\(\.demo-item\)\s*\{([^}]+)\}/)![1]
  assert.doesNotMatch(itemRule, /(?:display|position|contain|overflow|width|height|padding)\s*:/)
  for (const token of ['canvas', 'surface', 'line', 'grid', 'text', 'muted', 'blue', 'violet', 'amber', 'neutral']) {
    assert.equal([...theme.matchAll(new RegExp(`--color-demo-${token}:`, 'g'))].length, 2, token)
  }
})
