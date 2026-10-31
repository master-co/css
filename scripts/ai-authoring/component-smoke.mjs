// node --import tsx scripts/ai-authoring/component-smoke.mjs
// Artifacts stay outside the checkout. This is a deterministic smoke test, not a model eval.
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { project, masterFixture, tailwindFixture } from './component-fixtures.mjs'

const repository = fileURLToPath(new URL('../../', import.meta.url))
const output = await mkdtemp(join(tmpdir(), 'master-css-component-smoke-'))
const calls = []
const results = []
const failures = []
const clients = []
let browser

async function connect(root) {
  const client = new Client({ name: 'component-smoke', version: '1' })
  const transport = new StdioClientTransport({ command: process.execPath, args: [join(repository, 'packages/mcp/dist/bin/index.js'), '--root', root], stderr: 'pipe' })
  await client.connect(transport)
  clients.push(client)
  async function call(name, args) {
    const response = await client.callTool({ name, arguments: args })
    const envelope = response.structuredContent ?? JSON.parse(response.content[0].text)
    calls.push({ root, name, arguments: args, response: envelope })
    assert.equal(response.isError, undefined, JSON.stringify(envelope))
    assert.equal(envelope.result.status, 'success')
    return envelope.result.data
  }
  const workspace = await call('mastercss_workspace_info', {})
  assert.equal(await realpath(workspace.root), await realpath(root))
  assert.equal(workspace.manifest.status, 'loaded')
  return declarations => call('mastercss_suggest_classes', { declarations })
}

const shell = `html{font-family:Arial,sans-serif;color-scheme:light dark}body{margin:0;padding:32px;background:light-dark(#f8fafc,#111827);color:light-dark(#111827,#e5e7eb)}#fixture{max-width:460px;margin:0 auto}`
function document(fixture, theme) {
  return `<!doctype html><html class="${theme}" style="color-scheme:${theme}"><head><meta charset="utf-8"><title>Component smoke</title><style>${fixture.css}</style><style>${shell}</style></head><body><main id="fixture">${fixture.html}</main></body></html>`
}

async function observe(page, fixture, state, theme) {
  await page.setContent(document(fixture, theme))
  await page.evaluate(() => document.fonts.ready)
  const control = page.locator('#fixture input, #fixture button')
  await control.evaluate(el => { el.dataset.activations = '0'; el.addEventListener('click', () => { el.dataset.activations = String(Number(el.dataset.activations) + 1) }) })
  await page.mouse.move(0, 0)
  if (state === 'hover') await control.hover()
  if (state === 'checked') await page.locator('label').click()
  if (state === 'focus') {
    await page.keyboard.press('Tab')
    assert.ok(await control.evaluate(el => el.matches(':focus-visible')), 'Keyboard focus must be visible')
  }
  if (state === 'disabled') await control.evaluate(el => { el.disabled = true })
  await control.evaluate(async el => { await Promise.all(el.getAnimations({ subtree: true }).map(animation => animation.finished)) })
  const snapshot = await page.locator('#fixture').evaluate(root => ({
    text: root.textContent.trim(),
    overflow: document.documentElement.scrollWidth > innerWidth,
    nodes: [...root.querySelectorAll('*')].map(el => {
      const css = getComputedStyle(el)
      return { tag: el.tagName, checked: el.checked, disabled: el.disabled,
        rect: { width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height },
        css: Object.fromEntries([...css].filter(property => !property.startsWith('--')).map(property => [property, css.getPropertyValue(property)])) }
    })
  }))
  assert.equal(snapshot.overflow, false, 'No horizontal page overflow')
  // Check native behavior as well as appearance. Synthetic click on a disabled
  // HTML control must do nothing; keyboard activation must work when enabled.
  if (state === 'disabled') {
    await control.evaluate(el => el.click())
    assert.equal(await control.getAttribute('data-activations'), '0')
  } else if (state === 'focus') {
    await page.keyboard.press('Space')
    assert.equal(await control.getAttribute('data-activations'), '1')
    if (await control.evaluate(el => el.tagName === 'INPUT')) assert.equal(await control.isChecked(), true)
  } else if (state === 'checked') assert.equal(await control.isChecked(), true)
  return snapshot
}

try {
  const masterRoot = join(output, 'master-project')
  const master = await project(masterRoot, `@import '@master/css';\n@import '${join(repository, 'site/styles/docs-shell/theme.css')}';`, repository)
  const tailwindRoot = join(output, 'tailwind-target-project')
  const target = await project(tailwindRoot, '@import \'@master/css\';', repository)
  const fixtures = [await masterFixture(master, await connect(masterRoot)), await tailwindFixture(target, await connect(tailwindRoot), repository)]
  for (const fixture of fixtures) {
    for (const side of ['source', 'target']) await writeFile(join(output, `${fixture.id}-${side}.html`), document(fixture[side], 'light'))
    await writeFile(join(output, `${fixture.id}.json`), JSON.stringify(fixture, null, 2))
  }
  browser = await chromium.launch({ headless: true })
  await writeFile(join(output, 'canvas.html'), '<!doctype html><title>Component smoke</title>')
  for (const width of [390, 1280]) for (const theme of ['light', 'dark']) for (const hasTouch of [false, true]) for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport: { width, height: 760 }, hasTouch, colorScheme: theme, reducedMotion })
    const sourcePage = await context.newPage()
    const targetPage = await context.newPage()
    await sourcePage.goto(pathToFileURL(join(output, 'canvas.html')).href)
    await targetPage.goto(pathToFileURL(join(output, 'canvas.html')).href)
    const restingBackgrounds = new Map()
    try {
      for (const fixture of fixtures) for (const state of fixture.id === 'master-density' ? ['rest', 'checked', 'focus', 'disabled'] : ['rest', 'hover', 'focus', 'disabled']) {
        const key = `${fixture.id}-${width}-${theme}-${hasTouch ? 'touch' : 'mouse'}-${reducedMotion}-${state}`
        try {
          const source = await observe(sourcePage, fixture.source, state, theme)
          const target = await observe(targetPage, fixture.target, state, theme)
          assert.equal(source.text, target.text)
          if (fixture.id === 'tailwind-export') {
            assert.deepEqual(target, source)
            if (state === 'rest') restingBackgrounds.set(fixture.id, target.nodes[0].css['background-color'])
            if (state === 'hover') {
              assert.equal(await targetPage.evaluate(() => matchMedia('(hover: hover)').matches), !hasTouch)
              assert.equal(target.nodes[0].css['background-color'] === restingBackgrounds.get(fixture.id), hasTouch)
            }
          } else {
            assert.equal(source.nodes[0].css['padding-top'], '16px')
            assert.equal(target.nodes[0].css['padding-top'], '12px')
            assert.equal(source.nodes[1].css['column-gap'], '12px')
            assert.equal(target.nodes[1].css['column-gap'], '8px')
            for (let index = 0; index < source.nodes.length; index++) {
              for (const property of ['color', 'background-color', 'font-size', 'line-height', 'outline-style', 'outline-width', 'outline-color', 'border-top-color']) {
                assert.equal(target.nodes[index].css[property], source.nodes[index].css[property], `${index}/${property}`)
              }
              assert.equal(target.nodes[index].checked, source.nodes[index].checked)
              assert.equal(target.nodes[index].disabled, source.nodes[index].disabled)
            }
            if (state === 'focus') assert.equal(target.nodes.find(n => n.tag === 'INPUT').css['outline-width'], '2px')
          }
          // A screenshot equality check is additional to computed-style and interaction checks.
          // Capture resting screens only; focus interaction above intentionally activates controls.
          if (state === 'rest' && !hasTouch && reducedMotion === 'reduce') {
            const a = await sourcePage.screenshot({ path: join(output, `${key}-source.png`) })
            const b = await targetPage.screenshot({ path: join(output, `${key}-target.png`) })
            if (fixture.id === 'tailwind-export') assert.ok(a.equals(b), 'Source and target screenshot pixels must match')
          }
          results.push({ key, passed: true })
        } catch (error) {
          failures.push({ key, error: error.message })
          await targetPage.screenshot({ path: join(output, `${key}-failure.png`) })
        }
      }
    } finally { await context.close() }
  }
} catch (error) {
  failures.push({ phase: 'setup', error: error.stack })
} finally {
  const report = {
    kind: 'deterministic-component-smoke', generatedAt: new Date().toISOString(),
    revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim(),
    harnessHashes: Object.fromEntries(await Promise.all(['component-smoke.mjs', 'component-fixtures.mjs'].map(async file => [file,
      createHash('sha256').update(await readFile(new URL(file, import.meta.url))).digest('hex')]))),
    node: process.version, browser: browser?.version(),
    tailwind: JSON.parse(await readFile(join(repository, 'node_modules/tailwindcss/package.json'), 'utf8')).version,
    passed: results.length, failed: failures.length, results, failures,
    limits: ['Two repository components, not a model-success-rate evaluation.', 'Chromium only; no full accessibility audit.', 'Tailwind reset, theme variables and native state rules are retained.', 'Tailwind pilot states were added to the existing Export button; no runtime class-merging or plugin migration is covered.']
  }
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2))
  await writeFile(join(output, 'mcp-calls.json'), JSON.stringify(calls, null, 2))
  await Promise.all(clients.map(client => client.close()))
  await browser?.close()
  console.log(JSON.stringify({ output, passed: results.length, failed: failures.length, failures: failures.slice(0, 3) }, null, 2))
  if (failures.length) process.exitCode = 1
}
