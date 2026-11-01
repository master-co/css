import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { chromium } from '@playwright/test'
import { compareColors, colorComparisonPolicy } from './color-comparison.mjs'

let browser
before(async () => { browser = await chromium.launch() })
after(async () => { await browser.close() })

test('equivalent RGB/OKLCH white, hue notation and legacy alpha survive normalization', async () => {
  const input = [
    { property: 'background-color', actual: 'oklch(1 0 none)', expected: 'rgb(255, 255, 255)' },
    { property: 'color', actual: 'hsl(0 100% 50%)', expected: 'rgb(255, 0, 0)' },
    { property: 'outline-color', actual: 'color(srgb 1 0 0 / 0.5)', expected: 'rgba(255, 0, 0, 0.5)' },
    { property: 'color', actual: 'rgba(255, 0, 0, 0)', expected: 'rgba(0, 0, 0, 0)' }
  ]
  const before = JSON.stringify(input)
  const result = await compareColors(browser, input)
  assert.deepEqual(result.differences, [])
  assert.equal(result.equivalent.length, 4)
  assert.equal(result.policy, colorComparisonPolicy)
  assert.match(result.equivalent[0].normalizedActual, /^color\(srgb /)
  assert.equal(JSON.stringify(input), before)
})

test('real color, alpha, wide gamut, tiny visible channel and non-color differences remain failures', async () => {
  const input = [
    { property: 'color', actual: 'rgb(254,255,255)', expected: 'rgb(255,255,255)' },
    { property: 'background-color', actual: 'rgba(255,0,0,0.2)', expected: 'rgba(255,0,0,0.4)' },
    { property: 'color', actual: 'color(display-p3 1 0 0)', expected: 'rgb(255,0,0)' },
    { property: 'outline-color', actual: 'color(srgb 0.999 1 1)', expected: 'rgb(255,255,255)' },
    { property: 'height', actual: '19.2px', expected: '24px' },
    { property: 'opacity', actual: '0.5', expected: '0.501' },
    { property: 'color', actual: 'currentColor', expected: 'rgb(0,0,0)' },
    { property: 'color', actual: 'not-a-color', expected: 'rgb(0,0,0)' }
  ]
  const result = await compareColors(browser, input)
  assert.deepEqual(result.differences, input)
  assert.deepEqual(result.equivalent, [])
})

test('normalization leaves existing page DOM, style and state untouched', async () => {
  const page = await browser.newPage()
  try {
    await page.setContent('<style>body{color:red}</style><button autofocus>Keep state</button>')
    await page.locator('button').focus()
    const before = await page.content()
    await compareColors(browser, [{ property: 'color', actual: 'red', expected: 'rgb(255,0,0)' }])
    assert.equal(await page.content(), before)
    assert.equal(await page.locator('button').evaluate(el => el === document.activeElement), true)
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).color), 'rgb(255, 0, 0)')
  } finally { await page.close() }
})
