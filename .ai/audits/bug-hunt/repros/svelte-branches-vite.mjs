import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/src/index.ts'
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(join(repo, 'examples/svelte/package.json'))
const { build } = await import(require.resolve('vite'))
const { svelte } = await import(require.resolve('@sveltejs/vite-plugin-svelte'))
const browsers = createRequire(join(repo, 'packages/runtime/package.json'))('@playwright/test')
const root = mkdtempSync(join(repo, 'tmp/bug-hunt-svelte-branches-'))
try {
  symlinkSync(join(repo, 'examples/svelte/node_modules'), join(root, 'node_modules'), 'dir')
  writeFileSync(join(root, 'package.json'), '{"name":"svelte-branch-audit","private":true,"type":"module"}')
  writeFileSync(join(root, 'index.html'), '<!doctype html><html><head></head><body><div id="app"></div><script type="module" src="./entry.js"></script></body></html>')
  writeFileSync(join(root, 'entry.js'), `import { mount } from 'svelte';import App from './App.svelte';import './index.css';mount(App,{target:document.querySelector('#app')});`)
  writeFileSync(join(root, 'index.css'), '@master entry;')
  writeFileSync(join(root, 'App.svelte'), `<script>
let enabled = $state(true);
let items = $state([1]);
let settle;
let promise = $state(new Promise(resolve => { settle = resolve; }));
</script>
<button id="toggle" onclick={() => enabled = !enabled}>toggle</button>
{#if enabled}<div id="conditional" class="block">first</div>{:else}<div id="conditional" class="flex">alternate</div>{/if}
<button id="empty" onclick={() => items = []}>empty</button>
{#each items as item}<div id="list" class="inline">item</div>{:else}<div id="list" class="grid">empty</div>{/each}
<button id="resolve" onclick={() => settle('done')}>resolve</button>
<button id="reject" onclick={() => promise = Promise.reject('failed')}>reject</button>
{#await promise}<div id="await" class="block">pending</div>{:then value}<div id="await" class="inline-flex">resolved</div>{:catch error}<div id="await" class="inline-grid">rejected</div>{/await}
`)
  await build({ root, configFile: false, logLevel: 'warn', plugins: [createMasterCSSVitePlugin({ mode: 'static' }), svelte({ configFile: false })] })
  const css = readdirSync(join(root, 'dist/assets')).filter(path => path.endsWith('.css')).map(path => readFileSync(join(root, 'dist/assets', path), 'utf8')).join('\n')
  for (const display of ['block', 'flex', 'inline', 'grid', 'inline-flex', 'inline-grid']) assert(css.includes(`display:${display}`), display)
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.route('http://svelte-audit.test/**', route => {
        const path = new URL(route.request().url()).pathname
        return route.fulfill({ contentType: ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(path)] ?? 'text/html', body: readFileSync(join(root, 'dist', path === '/' ? 'index.html' : path.slice(1))) })
      })
      await page.goto('http://svelte-audit.test/')
      const display = async (id, expected) => {
        await browsers.expect(page.locator(id)).toHaveCSS('display', expected)
      }
      await display('#conditional', 'block')
      await display('#list', 'inline')
      await display('#await', 'block')
      await page.locator('#toggle').click()
      await display('#conditional', 'flex')
      await page.locator('#empty').click()
      await display('#list', 'grid')
      await page.locator('#resolve').click()
      await display('#await', 'inline-flex')
      await page.locator('#reject').click()
      await display('#await', 'inline-grid')
      assert.deepEqual(errors, [])
      console.log(JSON.stringify({ browser: name, actualSvelteViteStaticBuild: 'PASS', conditionalElse: 'PASS', emptyEach: 'PASS', awaitPendingThenCatch: 'PASS' }))
    } finally { await browser.close() }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
