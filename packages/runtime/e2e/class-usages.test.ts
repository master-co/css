import { test, expect } from '@playwright/test'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import init from './init'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

const html = `
  <div class="z:1">
    <div class="z:2">
      <div class="z:3"></div>
    </div>
  </div>
`

test('inner', async ({ page }) => {
  await init(page)
  await page.evaluate((html) => document.body.innerHTML = html, html)
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toEqual({
    'z:1': 1,
    'z:2': 1,
    'z:3': 1
  })
})

test('remove z1 element', async ({ page }) => {
  await init(page)
  await page.evaluate((html) => document.body.innerHTML = html, html)
  await page.evaluate(() => document.querySelector('.z\\:1')?.remove())
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toMatchObject({})
})

test('remove z2 element', async ({ page }) => {
  await init(page)
  await page.evaluate((html) => document.body.innerHTML = html, html)
  await page.evaluate(() => document.querySelector('.z\\:2')?.remove())
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toMatchObject({
    'z:1': 1
  })
})

test('remove z3 element', async ({ page }) => {
  await init(page)
  await page.evaluate((html) => document.body.innerHTML = html, html)
  await page.evaluate(() => document.querySelector('.z\\:3')?.remove())
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toMatchObject({
    'z:1': 1,
    'z:2': 1,
  })
})

test('remove body content and append again', async ({ page }) => {
  await init(page)
  await page.evaluate((html) => document.body.innerHTML = html, html)
  await page.evaluate((html) => {
    document.body.innerHTML = ''
    document.body.innerHTML = html
  }, html)
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toMatchObject({
    'z:1': 1,
    'z:2': 1,
    'z:3': 1,
  })
})

test('add an element to z1', async ({ page }) => {
  await init(page)
  await page.evaluate((html) => document.body.innerHTML = html, html)
  await page.evaluate(() => {
    const newElement = document.createElement('div')
    newElement.className = 'z:100 z:101 z:1'
    document.querySelector('.z\\:1')?.appendChild(newElement)
  })
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toMatchObject({
    'z:1': 2,
    'z:2': 1,
    'z:3': 1,
    'z:100': 1,
    'z:101': 1,
  })
})

test('add an element to z2', async ({ page }) => {
  await init(page)
  await page.evaluate((html) => document.body.innerHTML = html, html)
  await page.evaluate(() => {
    const newElement = document.createElement('div')
    newElement.className = 'z:100 z:101 z:2'
    document.querySelector('.z\\:2')?.appendChild(newElement)
  })
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toMatchObject({
    'z:1': 1,
    'z:2': 2,
    'z:3': 1,
    'z:100': 1,
    'z:101': 1,
  })
})

test('remove a class while the subtree is disconnected and append again', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    const parent = document.createElement('div')
    parent.id = 'parent'
    parent.innerHTML = '<div id="child" class="z:1"></div>'
    document.body.append(parent)
  })
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toMatchObject({
    'z:1': 1
  })

  await page.evaluate(() => {
    const parent = document.getElementById('parent')!
    const child = document.getElementById('child')!
    parent.remove()
    child.removeAttribute('class')
    document.body.append(parent)
  })
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toMatchObject({})
})

test('moves class subtrees across document and shadow roots without stale counts', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(async (manifest) => {
    const hostA = document.createElement('div')
    const hostB = document.createElement('div')
    document.body.append(hostA, hostB)
    const rootA = hostA.attachShadow({ mode: 'open' })
    const rootB = hostB.attachShadow({ mode: 'open' })
    rootA.innerHTML = '<section id="moved" class="block"><span class="fg:red-60"></span></section>'
    const runtimeA = await globalThis.MasterCSSRuntime.start({ manifest, root: rootA })
    const runtimeB = await globalThis.MasterCSSRuntime.start({ manifest, root: rootB })
    runtimeA.observe()
    runtimeB.observe()

    const before = {
      a: runtimeA.snapshot().usageCounts,
      b: runtimeB.snapshot().usageCounts
    }
    rootB.append(rootA.getElementById('moved')!)
    await new Promise(resolve => setTimeout(resolve, 0))
    const afterShadowMove = {
      a: runtimeA.snapshot().usageCounts,
      b: runtimeB.snapshot().usageCounts
    }

    rootB.append(rootB.getElementById('moved')!)
    await new Promise(resolve => setTimeout(resolve, 0))
    const afterSameRootMove = runtimeB.snapshot().usageCounts

    const documentNode = document.createElement('div')
    documentNode.className = 'font:bold'
    document.body.append(documentNode)
    await new Promise(resolve => setTimeout(resolve, 0))
    rootB.append(documentNode)
    await new Promise(resolve => setTimeout(resolve, 0))
    const afterDocumentMove = {
      document: globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().usageCounts,
      b: runtimeB.snapshot().usageCounts
    }

    runtimeA.deleteClassRules(['block', 'fg:red-60'])
    const sourceTextAfterCleanup = runtimeA.snapshot().cssText
    runtimeA.dispose()
    runtimeB.dispose()
    return { before, afterShadowMove, afterSameRootMove, afterDocumentMove, sourceTextAfterCleanup }
  }, defaultManifest)

  expect(result.before).toEqual({
    a: { block: 1, 'fg:red-60': 1 },
    b: {}
  })
  expect(result.afterShadowMove).toEqual({
    a: {},
    b: { block: 1, 'fg:red-60': 1 }
  })
  expect(result.afterSameRootMove).toEqual({ block: 1, 'fg:red-60': 1 })
  expect(result.afterDocumentMove.document).not.toHaveProperty('font:bold')
  expect(result.afterDocumentMove.b).toEqual({
    block: 1,
    'fg:red-60': 1,
    'font:bold': 1
  })
  expect(result.sourceTextAfterCleanup).toBe('')
})
