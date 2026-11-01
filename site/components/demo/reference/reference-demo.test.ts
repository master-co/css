import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { referenceDemoSections } from './source'
import { referenceScenes } from './scenes'
import { demoDocument } from './document'
import { compileManifestSync } from '@master/css-compiler/node'
import { createRenderSessionSync } from '@master/css/node'
import preset from '../../../utils/preset-manifest'

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
        assert.match(document, /--ui-text-body:/)
        assert.doesNotMatch(document, /--color-demo-/)
        assert.doesNotMatch(document, /<script\b|on(?:click|load|error)=/i)
        assert.doesNotMatch(document, /(?:src|url\()=['"]?(?:\.\.\.|\/hero\.jpg|\/mask\.png)/)
        count++
      } catch (error) { failures.push(`${page}#${section.id}: ${String(error)}`) }
    }
  }
  assert.deepEqual(failures, [])
  assert.ok(count >= 80, 'The retained gallery must exercise its full set of specimens')
})

// Readers copy these classes into their own projects. The demo frame also loads site tokens
// (materials, demo theme), so a site-only token would render here and fail for the reader.
test('every taught class compiles against the preset and its own example CSS alone', async () => {
  const failures: string[] = []
  for (const file of (await readdir(root)).filter(file => file.endsWith('.json'))) {
    for (const section of await referenceDemoSections(file.slice(0, -5))) {
      const compiled = section.css ? compileManifestSync(section.css, { baseManifest: preset }) : undefined
      const engine = createRenderSessionSync({ manifest: compiled?.manifest ?? preset })
      try {
        const invalid = engine.ensureClassRules(section.classes).invalidClassNames
          .filter(name => !compiled?.nativeClassNames.includes(name))
        if (invalid.length) failures.push(`${section.page}#${section.id}: ${invalid.join(', ')}`)
      } finally { engine.dispose() }
    }
  }
  assert.deepEqual(failures, [])
})

test('clear uses different float heights and real side-specific clearing', async () => {
  const sections = await referenceDemoSections('clear')
  for (const side of ['left', 'right']) {
    const section = sections.find(value => value.id === `clearing-${side}-floats`)!
    const scene = referenceScenes.clear(section)
    const document = demoDocument(section, scene)
    assert.ok(document.includes(`(clear:${side})`))
    assert.ok(document.includes('(height:4.5rem)'))
    assert.ok(document.includes('(height:8.5rem)'))
    assert.match(document, new RegExp(`\\(clear:${side}\\)`))
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

test('isolated documents include the system roles behind the site materials and the frame', () => {
  const html = '<div class="bg-surface-canvas (border-width:1px) (border-style:solid) b-line-contour">Preview</div>'
  const document = demoDocument({ page: 'materials', id: 'surface', title: 'Shared materials', html: [html], css: '', classes: [], classLists: [], highlighted: [] }, { html, caption: 'A single shared source' })
  assert.match(document, /--color-surface-canvas:var\(--ui-surface-canvas\)/)
  assert.match(document, /--color-line-contour:var\(--ui-line-contour\)/)
  assert.match(document, /--ui-surface-canvas: *light-dark\(/)
  // The neutral teaching tone resolves through preset palette steps that no class in the scene names.
  assert.match(document, /--ui-tone-neutral: *light-dark\(var\(--color-zinc-50\), *var\(--color-zinc-40\)\)/)
  assert.match(document, /--color-zinc-50:/)
  assert.match(document, /--color-zinc-40:/)
  assert.match(document, /--font-family-mono:/)
})

test('initial document schemes work before client controls initialize', () => {
  const html = '<div data-ui="tile">Theme specimen</div>'
  const section = { page: 'materials', id: 'scheme', title: 'Document scheme', html: [html], css: '', classes: [], classLists: [], highlighted: [] }
  const scene = { html, caption: 'Native schemes remain readable without JavaScript' }
  const automatic = demoDocument(section, scene)
  assert.doesNotMatch(automatic, /<html[^>]*class="light"/)
  assert.match(automatic, /--ui-tone-blue: *light-dark\(/)
  assert.match(automatic, /html\.dark *\{ *color-scheme: *dark; *\}/)
  assert.match(demoDocument(section, scene, 'light'), /<html[^>]*class="light"/)
  assert.match(demoDocument(section, scene, 'dark'), /<html[^>]*class="dark"/)
})

test('the frame paints teaching specimens with named system tones only', async () => {
  const frame = await readFile(new URL('./frame.css', import.meta.url), 'utf8')
  assert.doesNotMatch(frame, /--color-demo-|--stripe-/)
  const local = new Set([...frame.matchAll(/(--[a-z0-9-]+):/g)].map(match => match[1]))
  for (const [, token] of frame.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
    if (local.has(token)) continue
    assert.match(token, /^--ui-(?:surface|line|text|tone|focus)\b/, `${token}: frame paint comes from system roles`)
  }
})
