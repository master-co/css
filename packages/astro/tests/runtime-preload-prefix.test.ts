import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { preloadAstroRuntimeAssets } from '../src/runtime-preload'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function output() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-astro-preload-'))
  roots.push(root)
  mkdirSync(join(root, '_astro'))
  writeFileSync(join(root, '_astro/master-css-program.Ab12.bin'), 'MCSP')
  writeFileSync(join(root, '_astro/page.Cd34.js'), 'fetch(new URL("./master-css-program.Ab12.bin", import.meta.url).href)')
  writeFileSync(join(root, 'index.html'), '<html><head></head><body><script type="module" src="https://cdn.example.com/_astro/page.Cd34.js"></script></body></html>')
  return root
}

it('preloads runtime assets from build.assetsPrefix like Astro links its scripts', async () => {
  const root = output()
  await preloadAstroRuntimeAssets(root, '/docs', 'https://cdn.example.com/')
  const html = readFileSync(join(root, 'index.html'), 'utf8')
  expect(html).toContain('href="https://cdn.example.com/_astro/master-css-program.Ab12.bin"')
  expect(html).not.toContain('/docs/_astro/')
})

it('uses the per-extension assetsPrefix with its fallback', async () => {
  const root = output()
  await preloadAstroRuntimeAssets(root, '/docs', { js: 'https://js.example.com', fallback: 'https://assets.example.com' })
  const html = readFileSync(join(root, 'index.html'), 'utf8')
  expect(html).toContain('href="https://assets.example.com/_astro/master-css-program.Ab12.bin"')
})

it('keeps base-relative links without assetsPrefix', async () => {
  const root = output()
  await preloadAstroRuntimeAssets(root, '/docs')
  expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain('href="/docs/_astro/master-css-program.Ab12.bin"')
})
