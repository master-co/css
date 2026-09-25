import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'tests/fixtures/theme-reference')

it('delivers referenced native variables through an Astro scoped style', () => {
  execFileSync('pnpm', ['--dir', packageDir, 'build'], { cwd: packageDir, stdio: 'pipe', timeout: 120_000 })
  execFileSync(join(packageDir, 'node_modules/.bin/astro'), ['build'], {
    cwd: fixtureDir,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    stdio: 'pipe',
    timeout: 120_000
  })

  const outDir = join(fixtureDir, 'dist')
  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  const stylesheet = html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/)?.[1]
  expect(stylesheet).toBeTruthy()
  const seen = new Set<string>()
  const readCSS = (href: string): string => {
    if (seen.has(href)) return ''
    seen.add(href)
    const css = readFileSync(join(outDir, href), 'utf8')
    const imported = [...css.matchAll(/@import\s+"([^"]+)"/g)]
      .map(([, specifier]) => readCSS(new URL(specifier, new URL(href, 'http://localhost')).pathname))
    return [...imported, css].join('\n')
  }
  const css = readCSS(stylesheet!)
  expect(css).toMatch(/\.probe\[data-astro-cid-[^\]]+\]/)
  expect(css).toContain('var(--color-probe)')
  expect(css).toContain('--color-probe:#123456')
  expect(css).toContain('--color-probe:#abcdef')
  expect(css).not.toContain('@reference')
  expect(css).not.toContain('master-css-slot')
})
