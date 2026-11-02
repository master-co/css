import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { configuredExampleCSS, configuredMarkupClasses } from '@master/internal-site/css/configured-example.ts'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import { deliveryFences, deliveryFixture } from '../tests/delivery-examples'
import preset from '@master/internal-site/css/preset-manifest.ts'

const article = (path: string) => readFileSync(new URL(`../content/${path}/content.mdx`, import.meta.url), 'utf8')

test('Global styles print utility compiles from the displayed configuration', () => {
  const source = article('guide/global-styles')
  const example = /<DemoConfiguredExample name="global-related-guides"[\s\S]*?source=\{`([\s\S]*?)`\} html=\{`([\s\S]*?)`\}/.exec(source)
  assert.ok(example, 'Custom utilities must include their configuration and markup')
  const css = configuredExampleCSS(example[1], configuredMarkupClasses(example[2]))
  assert.match(css, /@media print\s*\{\s*\.print-hidden\s*\{\s*display:\s*none/)
  assert.match(css, /\.flow\s*\{\s*display:\s*grid;\s*gap:\s*var\(--spacing-md\)/)
  assert.match(css, /\.content-auto\s*\{\s*content-visibility:\s*auto/)
})

test('Global styles split files form one usable app entry', async () => {
  const files = deliveryFixture()
  try {
    const fences = deliveryFences(article('guide/global-styles'))
    for (const fence of fences.filter(item => item.language === 'css' && item.name.startsWith('styles/'))) files.write(fence.name, fence.text)
    const entry = join(files.root, 'styles/app.css')
    const result = await compileRenderedStylesheet(entry, readFileSync(entry, 'utf8'), { baseManifest: preset, projectDir: files.root, classes: ['notice', 'p-card'] })
    assert.deepEqual(result.diagnostics.filter(item => item.severity === 'error'), [])
    assert.match(result.css, /\.notice\s*\{/)
    assert.match(result.css, /body\s*\{/)
    assert.match(result.css, /padding:\s*var\(--spacing-card\)/)
    assert.match(result.css, /--spacing-card:\s*1\.5rem/)
  } finally { files.dispose() }
})
