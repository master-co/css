import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { MASTER_CSS_HYDRATION_MANIFEST_ATTR } from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_STYLESHEET_ASSET_SUFFIX } from '@master/css-schema/runtime-style'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'tests/fixtures/progressive')
const astroCLI = join(dirname(createRequire(import.meta.url).resolve('astro/package.json')), 'bin/astro.mjs')

it('pre-renders progressive CSS through the middleware of a static Astro build', () => {
  execFileSync(process.execPath, [astroCLI, 'build'], {
    cwd: fixtureDir,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    stdio: 'pipe',
    timeout: 120_000
  })

  const outDir = join(fixtureDir, 'dist')
  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  const style = html.match(/<style\b[^>]*\bid="master-css"[^>]*>([\s\S]*?)<\/style>/)
  expect(style?.[1]).toContain('font-weight:700')
  expect(style?.[1]).toContain('margin-top:12px')
  const manifest = style?.[0].match(new RegExp(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="([^"]+)"`))?.[1]
  expect(manifest).toBeTruthy()
  expect(existsSync(join(outDir, manifest!))).toBe(true)
  // The runtime adopts linked stylesheets through their sidecars.
  const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(([, href]) => href)
  expect(stylesheets.length).toBeGreaterThan(0)
  for (const href of stylesheets) {
    const sidecar = JSON.parse(readFileSync(join(outDir, href + MASTER_CSS_STYLESHEET_ASSET_SUFFIX), 'utf8'))
    expect(sidecar.version).toBe(1)
  }
})
