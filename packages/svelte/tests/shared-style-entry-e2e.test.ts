import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { expect, it } from 'vitest'
import { preview } from 'vite'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const builtPlugin = join(packageDir, 'dist/vite.js')
const viteCLI = join(dirname(createRequire(import.meta.url).resolve('vite/package.json')), 'bin/vite.js')

function fixture(globalStyleEntry?: boolean, withRootEntry = true) {
  const parent = join(packageDir, 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'style-entry-'))
  const put = (path: string, text: string) => {
    const file = join(root, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
  put('vite.config.ts', `
import { sveltekit } from '@sveltejs/kit/vite'
import masterCSS from ${JSON.stringify(builtPlugin)}
import { resolve } from 'node:path'

export default {
  build: { cssTarget: 'safari16.4' },
  plugins: [
    sveltekit({
      files: { routes: 'pages' },
      outDir: 'kit-build',
      adapter: { name: 'test', async adapt() {} }
    }),
    masterCSS(${JSON.stringify({ globalStyleEntry })}),
    {
      name: 'standalone-css-consumer',
      configEnvironment(name, config) {
        if (name !== 'client') return
        const input = config.build.rolldownOptions.input
        return { build: { rolldownOptions: { input: { ...input, standalone: resolve('src/standalone.js') } } } }
      }
    }
  ]
}
`)
  put('src/app.html', '<!doctype html><html lang="en"><head>%sveltekit.head%</head><body><div>%sveltekit.body%</div></body></html>')
  put('src/standalone.js', "import './standalone.css'")
  put('src/standalone.css', '.kit-standalone { border-color: var(--color-project); }')
  put('pages/+layout.svelte', `<script>
  ${withRootEntry ? "import './globals.css'" : ''}
  let { children } = $props()
</script>
{@render children()}
`)
  put('pages/globals.css', `
@import "@master/css";
@prune native;
@theme { --color-project: light-dark(#123456, #abcdef); }
:root { color-scheme: light dark; --kit-root-probe: 1; }
@keyframes project-pulse { to { opacity: 0.8; } }
`)
  put('pages/+page.svelte', `<script>
  ${withRootEntry ? '' : "import './globals.css'"}
  import '../src/standalone.css'
  import './home.css'
</script>
<main class="kit-home kit-standalone">Home</main>
<a href="/next">Next</a>
`)
  put('pages/+page.js', 'export const prerender = true')
  put('pages/home.css', '.kit-home { color: var(--color-project); animation: project-pulse 1s infinite; }')
  put('pages/next/+page.svelte', "<script>import './next.css'; import './own.css'</script><main class=\"kit-next kit-own\">Dynamic route</main>")
  put('pages/next/next.css', '.kit-next { color: var(--color-project); animation: project-pulse 1s infinite; }')
  put('pages/next/own.css', '@theme { --color-local: teal; } .kit-own { background: var(--color-local); border-color: var(--color-project); }')
  put('pages/static/+page.js', 'export const prerender = true; export const csr = false')
  put('pages/static/+page.svelte', "<script>import './static.css'</script><main class=\"kit-static\">Server only</main>")
  put('pages/static/static.css', '.kit-static { color: var(--color-project); animation: project-pulse 1s infinite; }')
  return root
}

function build(root: string) {
  execFileSync(process.execPath, [viteCLI, 'build'], { cwd: root, stdio: 'pipe', timeout: 120_000 })
  const dir = join(root, 'kit-build/output/client')
  const sheet = (selector: string) => {
    const assets = join(dir, '_app/immutable/assets')
    return readdirSync(assets).filter(file => file.endsWith('.css')).map(file => readFileSync(join(assets, file), 'utf8'))
      .find(css => css.includes(selector))
  }
  const standalone = (JSON.parse(readFileSync(join(dir, '.vite/manifest.json'), 'utf8'))['src/standalone.js']?.css ?? [])
    .map((file: string) => readFileSync(join(dir, file), 'utf8')).join('\n')
  return { sheet, standalone }
}

it('shares a proven root entry across SvelteKit pages and keeps independent consumers complete', async () => {
  const root = fixture()
  let server: Awaited<ReturnType<typeof preview>> | undefined
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  const previous = process.cwd()
  try {
    const output = build(root)
    const entry = output.sheet('--kit-root-probe:')
    expect(entry).toContain('--color-project:')
    expect(entry).toContain('@keyframes project-pulse')
    for (const selector of ['.kit-home{', '.kit-static{']) {
      const css = output.sheet(selector)
      expect(css).toContain('var(--color-project)')
      expect(css).not.toContain('@keyframes project-pulse')
    }
    expect(output.sheet('.kit-static{')).not.toContain('--color-project:')
    expect(output.sheet('.kit-own{')).toContain('--color-local:')
    expect(output.sheet('.kit-own{')).toContain('--color-project:')
    expect(output.standalone).toContain('.kit-standalone{')
    expect(output.standalone).toContain('--color-project:')

    process.chdir(root)
    server = await preview({ root, logLevel: 'silent', preview: { host: '127.0.0.1', port: 0 } })
    browser = await chromium.launch()
    const page = await browser.newPage({ colorScheme: 'light' })
    const base = server.resolvedUrls!.local[0]
    await page.goto(base)
    expect(await page.locator('.kit-home').evaluate(element => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')
    await page.locator('a').click()
    await page.waitForURL('**/next')
    expect(await page.locator('.kit-next').evaluate(element => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')

    const fresh = await browser.newPage({ colorScheme: 'dark', javaScriptEnabled: false })
    for (const route of ['next', 'static']) {
      const response = await fresh.goto(new URL(route, base).href)
      expect(response?.status()).toBe(200)
      expect(await fresh.locator(`.kit-${route}`).evaluate(element => getComputedStyle(element).color)).toBe('rgb(171, 205, 239)')
      expect(await fresh.locator(`.kit-${route}`).evaluate(element => element.getAnimations()
        .some(animation => animation instanceof CSSAnimation && animation.animationName === 'project-pulse'))).toBe(true)
    }
  } finally {
    process.chdir(previous)
    await browser?.close()
    await new Promise<void>(resolve => server ? server.httpServer.close(() => resolve()) : resolve())
    rmSync(root, { recursive: true, force: true })
  }
}, 120_000)

it.each([
  { setting: false, rootEntry: true, carriesToken: true },
  { setting: undefined, rootEntry: false, carriesToken: true },
  { setting: true, rootEntry: true, carriesToken: false }
])('leaves local CSS complete unless the user or graph covers it ($setting, root entry $rootEntry)', ({ setting, rootEntry, carriesToken }) => {
  const root = fixture(setting, rootEntry)
  try {
    const output = build(root)
    const css = output.sheet('.kit-static{')
    expect(css).toContain('var(--color-project)')
    expect(css!.includes('--color-project:')).toBe(carriesToken)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 120_000)
