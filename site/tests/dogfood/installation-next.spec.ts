import { expect, test } from '@playwright/test'
import { nextInstallationModes } from '../next-installation-examples'

for (const mode of nextInstallationModes) test(`Next.js production application delivers ${mode} CSS`, async ({ page, browser }) => {
  const url = JSON.parse(process.env.NEXT_INSTALLATION_FIXTURES!)[mode]
  const errors: string[] = []
  const requests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
  page.on('request', request => requests.push(request.url()))
  await page.goto(url)
  const heading = page.getByRole('heading', { name: 'Hello World' })
  await expect(heading).toHaveCSS('font-style', 'italic')
  await expect(heading).toHaveCSS('margin-top', '16px')
  if (mode !== 'static') {
    await heading.evaluate(element => element.classList.add('p:xl'))
    await expect(heading).toHaveCSS('padding-top', '32px')
  }
  await page.goto(url + '/dynamic')
  await expect(page.getByRole('heading', { name: 'Request-time heading' })).toHaveCSS('font-style', 'italic')
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! })
  try {
    const noScript = await context.newPage()
    await noScript.goto(url)
    const initial = noScript.getByRole('heading', { name: 'Hello World' })
    await expect(initial).toBeVisible()
    await expect(initial).toHaveCSS('font-style', mode === 'runtime' ? 'normal' : 'italic')
    if (mode !== 'runtime') await expect(initial).toHaveCSS('margin-top', '16px')
    await noScript.goto(url + '/dynamic')
    const dynamic = noScript.getByRole('heading', { name: 'Request-time heading' })
    await expect(dynamic).toBeVisible()
    await expect(dynamic).toHaveCSS('font-style', mode === 'static' ? 'italic' : 'normal')
  } finally { await context.close() }
  if (mode === 'static') expect(requests.some(url => url.endsWith('.wasm'))).toBe(false)
  expect(errors).toEqual([])
})
