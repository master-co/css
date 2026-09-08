import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const plugin = await readFile(new URL('../../../../packages/figma/dist/plugin.min.js', import.meta.url), 'utf8')
const html = await readFile(new URL('../../../../packages/figma/out/import-variables.html', import.meta.url), 'utf8')
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const page = await browser.newPage()
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    const variables = []
    const collection = { id: 'audit', name: 'Audit', defaultModeId: 'default', variableIds: [],
      modes: [{ name: 'Default', modeId: 'default' }],
      addMode(name) { const id = `mode-${this.modes.length}`; this.modes.push({ name, modeId: id }); return id }
    }
    const figma = {
      command: 'import-variables', showUI() {},
      notify(message) { void page.evaluate(value => window.auditNotifications.push(value), message) },
      ui: { async postMessage(message) {
        const frame = page.frames().find(frame => frame.url().endsWith('/import.html'))
        assert(frame, 'built UI frame is loaded')
        await frame.evaluate(value => window.postMessage({ pluginMessage: value }, '*'), message)
      } },
      variables: {
        async getLocalVariableCollectionsAsync() { return [collection] },
        async getVariableCollectionByIdAsync() { return collection },
        async getLocalVariablesAsync() { return variables },
        async getVariableByIdAsync(id) { return variables.find(v => v.id === id) },
        createVariable(name, owner, resolvedType) {
          assert.equal(owner.id, collection.id)
          const variable = { id: `v-${variables.length}`, name, resolvedType, variableCollectionId: owner.id, valuesByMode: {},
            setValueForMode(mode, value) {
              assert(collection.modes.some(item => item.modeId === mode))
              if (value?.type === 'VARIABLE_ALIAS') assert.equal(variables.find(item => item.id === value.id)?.resolvedType, resolvedType)
              else assert.equal(typeof value, ({ FLOAT: 'number', STRING: 'string', BOOLEAN: 'boolean', COLOR: 'object' })[resolvedType])
              this.valuesByMode[mode] = JSON.parse(JSON.stringify(value))
            }
          }
          variables.push(variable); collection.variableIds.push(variable.id); return variable
        }
      }
    }
    runInNewContext(plugin, { figma, __uiFiles__: { 'import-variables': '' }, console })
    await page.exposeFunction('sendToPlugin', message => figma.ui.onmessage(message))
    await page.addInitScript(() => {
      if (window !== window.top) return
      window.auditNotifications = []
      window.addEventListener('message', event => {
        if (event.data?.pluginMessage) void window.sendToPlugin(event.data.pluginMessage)
      })
    })
    await page.route('http://figma-audit.test/**', route => route.fulfill({ contentType: 'text/html', body:
      new URL(route.request().url()).pathname === '/import.html' ? html : '<!doctype html><iframe src="/import.html"></iframe>' }))
    await page.goto('http://figma-audit.test/')
    const frame = page.frameLocator('iframe')
    await frame.locator('select').selectOption(collection.id)
    const data = { variables: [
      { namespace: 'space.layout', key: 'alias', value: 'var(--space-layout-base)' },
      { namespace: 'space.layout', key: 'base', value: 16 },
      { namespace: 'space.layout', key: 'base', value: 24, mode: 'dark' },
      { key: 'visible', value: false }
    ], modes: ['dark'] }
    await frame.locator('textarea').fill(JSON.stringify(data))
    await frame.getByRole('button', { name: 'Import', exact: true }).click()
    await page.waitForFunction(() => window.auditNotifications.includes('Import succeeded'))
    assert.deepEqual(variables.map(v => v.name), ['space/layout/alias', 'space/layout/base', 'visible'])
    assert.equal(variables[0].valuesByMode.default.id, variables[1].id)
    assert.deepEqual(variables[1].valuesByMode, { default: 16, 'mode-1': 24 })
    const beforeFailure = JSON.stringify(variables.map(({ valuesByMode }) => valuesByMode))
    await frame.locator('textarea').fill(JSON.stringify({ variables: { space: { layout: { base: '#ffffff' } } } }))
    await frame.getByRole('button', { name: 'Import', exact: true }).click()
    await page.waitForFunction(() => window.auditNotifications.some(message => message.includes('Variable type mismatch')))
    assert.equal(JSON.stringify(variables.map(({ valuesByMode }) => valuesByMode)), beforeFailure)
    assert(await frame.getByRole('button', { name: 'Import', exact: true }).isEnabled())
    await frame.locator('textarea').fill(JSON.stringify(data))
    await frame.getByRole('button', { name: 'Import', exact: true }).click()
    await page.waitForFunction(() => window.auditNotifications.filter(message => message === 'Import succeeded').length === 2)
    assert.equal(variables.length, 3)
    assert.deepEqual(pageErrors, [])
    console.log(JSON.stringify({ browser: name, version: browser.version(), actualBuiltPluginAndUI: true,
      figmaAPI: 'explicit in-memory mock', definitionsModesAliasesBoolean: 'PASS', errorAndRetry: 'PASS' }))
  } finally { await browser.close() }
}
