import { expect, test, type Locator } from '@playwright/test'

async function displayedCode(block: Locator) {
  return block.locator('pre code .line').evaluateAll(lines => lines.map(line => line.textContent ?? '').join('\n'))
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => { document.body.dataset.copiedText = text } }
    })
  })
})

test('plain and named code blocks share the demo frame and copy displayed text', async ({ page }, info) => {
  await page.goto('/en/guide/elevation')
  const demo = page.locator('.demo').first()
  const plain = page.locator('.code-plain').first()
  const named = page.locator('.code:has(.code-file-label)').first()
  await expect(plain).toBeVisible()
  await expect(named).toBeVisible()
  for (const block of [plain, named]) {
    await expect(block).toHaveCSS('border-width', await demo.evaluate(element => getComputedStyle(element).borderWidth))
    await expect(block).toHaveCSS('border-color', await demo.evaluate(element => getComputedStyle(element).borderColor))
    await expect(block).toHaveCSS('border-radius', await demo.evaluate(element => getComputedStyle(element).borderRadius))
  }

  const plainCopy = plain.getByRole('button', { name: 'Copy code' })
  await plainCopy.focus()
  await page.keyboard.press('Enter')
  await expect(plainCopy).toBeFocused()
  await expect(plainCopy).toHaveCSS('outline-width', '2px')
  await expect(page.locator('body')).toHaveAttribute('data-copied-text', await displayedCode(plain))
  await expect(plain.getByRole('status')).toHaveText('Code copied')

  await expect(named.getByRole('button', { name: 'index.css', exact: true })).toHaveCount(0)
  const namedCopy = named.getByRole('button', { name: 'Copy index.css' })
  await namedCopy.click()
  await expect(page.locator('body')).toHaveAttribute('data-copied-text', await displayedCode(named))

  await plain.screenshot({ path: info.outputPath('plain-code.png'), caret: 'initial' })
  await named.screenshot({ path: info.outputPath('named-code.png'), caret: 'initial' })

  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: () => Promise.reject(new Error('Denied')) }
  }))
  await plainCopy.click()
  await expect(plain.getByRole('status')).toContainText('Clipboard unavailable')
  await expect(plain.getByRole('status')).toBeVisible()

  if (info.project.name.startsWith('mobile')) {
    const endIsReachable = await plain.evaluate(element => {
      const pre = element.querySelector('pre')!
      pre.scrollLeft = pre.scrollWidth
      return pre.scrollWidth > pre.clientWidth
        && element.querySelector('.line')!.getBoundingClientRect().right <= element.querySelector('button')!.getBoundingClientRect().left
    })
    expect(endIsReachable).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('persisted code tabs expose state, support arrow keys, and keep copy visible', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('pm', JSON.stringify('yarn')))
  await page.goto('/en/guide/installation')
  const frame = page.locator('.codeTabs').first()
  const tabs = frame.getByRole('tab')
  await expect(tabs).toHaveCount(4)
  await expect(frame.getByRole('tab', { name: 'yarn', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(frame.getByRole('tabpanel', { name: 'yarn' })).toBeVisible()
  const yarn = frame.getByRole('tab', { name: 'yarn', exact: true })
  await yarn.focus()
  await page.keyboard.press('ArrowRight')
  const npm = frame.getByRole('tab', { name: 'npm', exact: true })
  await expect(npm).toBeFocused()
  await expect(npm).toHaveAttribute('aria-selected', 'true')
  await expect(npm).toHaveAttribute('tabindex', '0')
  await page.keyboard.press('End')
  await expect(yarn).toBeFocused()
  await expect(yarn).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Home')
  await expect(npm).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(yarn).toBeFocused()
  await page.keyboard.press('Home')
  await expect(npm).toBeFocused()
  const copy = frame.getByRole('button', { name: 'Copy npm', exact: true })
  await expect(copy).toBeVisible()
  await copy.click()
  await expect(page.locator('body')).toHaveAttribute('data-copied-text', await displayedCode(frame.getByRole('tabpanel', { name: 'npm' })))
  expect(await frame.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  await frame.screenshot({ path: info.outputPath('code-tabs.png'), caret: 'initial' })

  if (info.project.name === 'desktop-light') {
    await page.setViewportSize({ width: 260, height: 900 })
    const tablist = frame.getByRole('tablist')
    expect(await tablist.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
    await tablist.evaluate(element => { element.scrollLeft = element.scrollWidth })
    await expect(copy).toBeVisible()
    expect(await frame.evaluate(element => element.getBoundingClientRect().right - element.querySelector('.code-copy-button')!.getBoundingClientRect().right)).toBeGreaterThanOrEqual(0)
  }
})

test('independent documentation copy controls are not duplicated', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-light')
  await page.goto('/en/design-system')
  const example = page.locator('[data-tooling-example="sort"]')
  await expect(example).toBeVisible()
  await expect(example.locator('.code-copy-button')).toHaveCount(0)
  await expect(example.locator('.doc-copy-button')).toHaveCount(2)
})
