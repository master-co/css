import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { referenceDemoSections } from './source'
import { referenceScenes } from './scenes'
import { demoDocument } from './document'
import { referenceDemoCoverage } from './coverage'

const root = new URL('../../../app/[locale]/reference/', import.meta.url)

test('every authored utility teaching section has its own demo and compilable scene', async () => {
  let count = 0
  const failures: string[] = []
  const pages = (await readdir(root, { withFileTypes: true })).filter(entry => entry.isDirectory())
  for (const page of pages) {
    const source = await readFile(new URL(`${page.name}/content.mdx`, root), 'utf8').catch(() => '')
    if (!source) continue
    assert.ok(referenceScenes[page.name], `No scene family for ${page.name}`)
    const sections = await referenceDemoSections(page.name)
    const mounted = [...source.matchAll(/<DemoExample page="[\w-]+" section="([\w-]+)" \/>/g)].map(match => match[1])
    assert.deepEqual(mounted, referenceDemoCoverage[page.name], `${page.name}: coverage inventory drift`)
    assert.equal(new Set(mounted).size, mounted.length, `${page.name}: duplicate section demo`)
    const authored = [...source.split(/(```[\s\S]*?```)/g).filter((_, index) => index % 2 === 0).join('\n').matchAll(/^### .+? \\\{#([\w-]+)\\\}/gm)]
    for (const heading of authored) {
      assert.ok(source.includes(`<DemoExample page="${page.name}" section="${heading[1]}" />`), `${page.name}#${heading[1]} has no dedicated demo`)
    }
    for (const match of source.matchAll(/<DemoExample page="([\w-]+)" section="([\w-]+)" \/>/g)) {
      const section = sections.find(value => value.id === match[2])
      assert.ok(section, `${page.name}#${match[2]} has no resolved source (including MDX includes)`)
      try {
        const scene = referenceScenes[page.name](section)
        assert.ok(scene.caption.trim(), 'Every visual needs an explanation')
        assert.ok(scene.html.includes('data-target') || scene.html.includes('class='), 'A scene needs an actual CSS subject')
        const document = demoDocument(section, scene)
        assert.match(document, /@layer theme,base,defaults,components,utilities;/)
        assert.match(document, /--color-demo-text:/)
        assert.doesNotMatch(document, /<script\b|on(?:click|load|error)=/i)
        assert.doesNotMatch(document, /(?:src|url\()=['"]?(?:\.\.\.|\/hero\.jpg|\/mask\.png)/)
        count++
      } catch (error) { failures.push(`${page.name}#${section.id}: ${String(error)}`) }
    }
  }
  assert.deepEqual(failures, [])
  assert.equal(Object.keys(referenceDemoCoverage).length, 183)
  assert.equal(count, 711)
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

test('new demo tokens are defined and specimens do not force layout on demo items', async () => {
  const css = await readFile(new URL('../../../styles/demo.css', import.meta.url), 'utf8')
  const itemRule = css.match(/:where\(\.demo-item\)\s*\{([^}]+)\}/)![1]
  assert.doesNotMatch(itemRule, /(?:display|position|contain|overflow|width|height|padding)\s*:/)
  for (const token of ['canvas', 'surface', 'line', 'grid', 'text', 'muted', 'blue', 'violet', 'amber', 'neutral']) {
    assert.equal([...css.matchAll(new RegExp(`--color-demo-${token}:`, 'g'))].length, 2, token)
  }
})
