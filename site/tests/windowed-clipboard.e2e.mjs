/** Run in a graphical desktop session: native WebKit writes and keyboard paste, without clipboard mocks or permissions. */
import assert from 'node:assert/strict'
import { webkit } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3217'
const output = new URL('../test-results/interior-redesign/', import.meta.url)
const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
await mkdir(output, { recursive: true })
const result = { checkedAt: new Date().toISOString(), revision: process.env.MASTER_SITE_REVISION ?? null, engine: 'webkit', headless: false, nativeCopies: [], nativeSearchPastes: [] }
const browser = await webkit.launch({ headless: false })
async function pasteText(page) {
  await page.evaluate(() => {
    const input = document.createElement('textarea')
    input.id = 'native-clipboard-verification'
    input.style.cssText = 'position:fixed;inset:80px 40px auto;z-index:99999'
    document.body.prepend(input)
  })
  const input = page.locator('#native-clipboard-verification')
  await input.click()
  await page.keyboard.press(`${modifier}+V`)
  const value = await input.inputValue()
  await input.evaluate(element => element.remove())
  return value
}
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  for (const locale of ['', '/tw']) {
    await page.goto(base + locale + '/brand', { waitUntil: 'networkidle' })
    await page.bringToFront()
    const card = page.locator('.brand-color[data-token="--color-amber-40"]')
    await card.getByRole('button').click()
    await page.waitForFunction(() => document.querySelector('.brand-color[data-token="--color-amber-40"] [role="status"]').textContent === 'Copied', {}, { timeout: 15000 })
    const value = await pasteText(page)
    assert.equal(value, 'var(--color-amber-40)')
    result.nativeCopies.push({ route: locale + '/brand', subject: 'CSS variable', exact: true, value })
    await page.evaluate(() => scrollTo(0, 0))
    for (let attempt = 1; attempt <= 12; attempt++) {
      await page.keyboard.press(`${modifier}+k`)
      const search = page.locator('dialog.ui-dialog[data-variant="search"][open]')
      await search.waitFor()
      const input = search.getByRole('combobox')
      await page.keyboard.press(`${modifier}+V`)
      await page.waitForFunction(() => document.querySelector('dialog.ui-dialog[data-variant="search"][open] input')?.value === 'var(--color-amber-40)', {}, { timeout: 5000 })
      assert.equal(await input.inputValue(), 'var(--color-amber-40)')
      result.nativeSearchPastes.push({ locale: locale || 'en', attempt, exact: true })
      await input.press(`${modifier}+A`)
      await input.press('Backspace')
      assert.equal(await input.inputValue(), '')
      await page.keyboard.press('Escape')
    }
    await page.goto(base + locale + '/design-system/review/code', { waitUntil: 'networkidle' })
    const panel = page.locator('xpath=//h2[@id="code-languages"]/following-sibling::div[contains(concat(" ", @class, " "), " ui-handbook-section ")][1]').locator('.ui-code')
    await panel.getByRole('tab', { name: 'settings.json', exact: true }).click()
    const expected = await panel.getByRole('tabpanel').locator('.line').evaluateAll(lines => lines.map(line => line.textContent.replace(/[\t ]+$/u, '')).join('\n'))
    await panel.locator('[data-code-copy]').click()
    await panel.getByRole('status').filter({ hasText: 'settings.json copied' }).waitFor()
    const code = await pasteText(page)
    assert.equal(code, expected)
    result.nativeCopies.push({ route: locale + '/design-system/review/code', subject: 'settings.json', exact: true, length: code.length })
  }
} finally {
  await browser.close()
  result.completedAt = new Date().toISOString()
  await writeFile(new URL('windowed-clipboard-audit.json', output), JSON.stringify(result, null, 2) + '\n')
}
console.log(JSON.stringify({ nativeCopies: result.nativeCopies.length, nativeSearchPastes: result.nativeSearchPastes.length, failures: 0 }))
