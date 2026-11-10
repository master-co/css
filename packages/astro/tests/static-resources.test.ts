import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { buildAstroFixture } from './static-output-helper'

const fixtureDir = fileURLToPath(new URL('./fixtures/static-resources/', import.meta.url))

it('publishes the resources and retained imports of the stylesheet entry into the client output', () => {
  buildAstroFixture(fixtureDir)
  const outDir = join(fixtureDir, 'dist')
  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  const hrefs = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match => match[1])
  expect(hrefs).toHaveLength(1)
  const directory = join(outDir, dirname(hrefs[0]))
  const css = readFileSync(join(outDir, hrefs[0]), 'utf8')
  const urls = [...css.matchAll(/url\(\s*["']?([^"')]+\.woff2)/g)].map(match => match[1])
  expect(urls).toHaveLength(1)
  const font = join(directory, urls[0])
  expect(existsSync(font), font).toBe(true)
  expect(readFileSync(font, 'utf8')).toBe('wOF2-fixture-font')
  // The local stylesheet importing a remote URL stays a linked boundary.
  const imports = [...css.matchAll(/@import\s*(?:url\()?["']?(\.\/[^"')]+\.css)/g)].map(match => match[1])
  expect(imports.length).toBeGreaterThan(0)
  for (const href of imports) {
    const file = join(directory, href)
    expect(existsSync(file), file).toBe(true)
  }
  expect(imports.map(href => readFileSync(join(directory, href), 'utf8')).join('\n')).toContain('.remote')

  // A server-rendered `?inline` stylesheet publishes its resources the same way.
  const inline = readFileSync(join(outDir, 'inline/index.html'), 'utf8')
  const inlineURLs = [...inline.matchAll(/url\(\s*["']?(\/[^"')]+\.woff2)/g)].map(match => match[1])
  expect(inlineURLs).toHaveLength(1)
  expect(readFileSync(join(outDir, inlineURLs[0]), 'utf8')).toBe('wOF2-inline-font')
}, 120_000)
