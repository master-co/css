import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { buildAstroFixture } from '../static-output-helper'

const fixtureDir = fileURLToPath(new URL('../fixtures/static-usage/', import.meta.url))

it('links the utility and token used by each static Astro page', () => {
  buildAstroFixture(fixtureDir)
  const outDir = join(fixtureDir, 'dist')
  for (const [route, className, token] of [
    ['index.html', 'p-md', 'spacing-md'],
    ['second/index.html', 'p-lg', 'spacing-lg']
  ]) {
    const html = readFileSync(join(outDir, route), 'utf8')
    expect(html).toContain(`class="${className}"`)
    const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)]
    expect(stylesheets.length).toBeGreaterThan(0)
    const css = stylesheets.map(([, href]) => readFileSync(join(outDir, href), 'utf8')).join('\n')
    expect(css).toContain(`.${className}{padding:var(--${token})}`)
    expect(css).toMatch(new RegExp(`--${token}:\\s*[^;}]+`))
  }
}, 120_000)
