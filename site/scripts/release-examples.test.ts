import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { createToolingSessionSync } from '@master/css-tooling/node'
import { fixMasterCSSContent, lintMasterCSSContent, resolveMasterCSSLintRules } from '@master/css-tooling/lint'
import preset from '../utils/preset-manifest'
import { configuredExampleCSS, configuredMarkupClasses } from '../reference/configured-example'
import { releaseContent } from '../utils/release-content'
import { releaseFigures } from '../content/blog/v2/illustrations'
import { anatomyClass, componentMarkup, componentSource, fieldworkMarkup, fieldworkSource, lintBefore, lintAfter, themeMarkup, themeSource } from '../content/blog/v2/examples'
import { documentationHygieneIssues } from '../tests/document-hygiene'
import { journalAssets, journalDescription, journalMarkup, journalSetup, journalSource, journalTitle } from '../content/blog/v2/journal'

test('release examples compile against the public preset and their stated CSS', () => {
  for (const html of [fieldworkMarkup, themeMarkup]) {
    const css = configuredExampleCSS(html === fieldworkMarkup ? fieldworkSource : themeSource, configuredMarkupClasses(html))
    assert.match(css, /padding:var\(--spacing-story\)/)
    assert.match(css, /color:var\(--color-brand\)/)
    assert.match(css, /--spacing-story:1\.5rem/)
  }
  const component = configuredExampleCSS(componentSource, configuredMarkupClasses(componentMarkup))
  const journal = configuredExampleCSS(journalSource, configuredMarkupClasses(journalMarkup))
  assert.match(journal, /@media\s*\(width >= 38rem\)/)
  assert.match(journal, /padding:var\(--spacing-story\)/)
  assert.match(component, /@layer components/)
  assert.match(component, /@layer utilities/)
  assert.match(component, /padding-inline:\s*1rem/)
  assert.match(component, /padding-inline:var\(--spacing-lg\)/)
  assert.match(component, /--spacing-lg:1\.5rem/) // The layer figure measures this preset value.
  const anatomy = configuredExampleCSS('', [anatomyClass])
  assert.match(anatomy, /@media \(width >= 52\.125rem\)/)
  assert.match(anatomy, /color:var\(--color-blue-70\)/)
})

test('the illustrated conflict and safe replacement come from real tooling', () => {
  const lintSession = createToolingSessionSync({ manifest: preset })
  const options = { content: lintBefore, filePath: 'journal.html', rules: resolveMasterCSSLintRules(undefined), lintSession }
  try {
    const diagnostics = lintMasterCSSContent(options).diagnostics
    assert.ok(diagnostics.some(item => item.message === 'Remove class "p-lg"; it is overridden by class "p-md" in generated CSS.'))
    assert.equal(fixMasterCSSContent(options), lintAfter)
  } finally { lintSession.dispose() }
})

test('the release exports all figures and executable examples without MDX residue', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const { markdown, searchMarkdown } = await releaseContent(root)
  assert.deepEqual(documentationHygieneIssues(markdown), [])
  for (const [name, figure] of Object.entries(releaseFigures)) {
    if (name === 'fieldwork') continue // Retained cover artwork; the article embeds the working journal.
    assert.ok(markdown.includes(figure.title), figure.title)
    assert.ok(searchMarkdown.includes(figure.description[0]), figure.title)
  }
  assert.ok(markdown.includes(themeMarkup))
  assert.ok(markdown.includes(componentMarkup))
  assert.ok(markdown.includes(journalMarkup))
  assert.ok(searchMarkdown.includes(journalDescription))
  assert.ok(markdown.includes(journalTitle))
  assert.ok(markdown.includes(journalSetup))
  for (const asset of journalAssets) {
    assert.ok(markdown.includes(`[${asset.label}](${asset.href})`))
    assert.ok(`${journalSource}\n${journalMarkup}`.includes(asset.href))
    await readFile(new URL(`../public${asset.href}`, import.meta.url))
  }
  assert.doesNotMatch(markdown, /<Release(?:Example|Illustration|Journal)|Lorem ipsum/)
  for (const name of Object.keys(releaseFigures)) {
    for (const theme of ['light', 'dark']) {
      const image = await readFile(new URL(`../assets/images/release-v2/${name}-${theme}.png`, import.meta.url))
      assert.equal(image.readUInt32BE(16), 1440)
      assert.equal(image.readUInt32BE(20), 960)
    }
  }
})
