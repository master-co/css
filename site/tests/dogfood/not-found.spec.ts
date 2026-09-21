import { expect, test } from '@playwright/test'

test('unknown top-level paths return the site 404 on the first and repeated requests', async ({ request }) => {
  // Request missing paths before any locale page so a cold static-path cache is covered.
  // Repeating also catches Next's export-mode dev cache being cleared after a miss.
  for (const pathname of ['/sw.js', '/missing-top-level-page']) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request.get(pathname)
      expect(response.status(), `${pathname}, request ${attempt + 1}`).toBe(404)
      const html = await response.text()
      expect(html).toContain('This page does not exist')
      expect(html).not.toContain('missing param')
      expect(html).not.toContain('load is not a function')
    }
  }

  for (const locale of ['en', 'tw']) {
    const response = await request.get(`/${locale}`)
    expect(response.status(), `/${locale}`).toBe(200)
    expect(await response.text()).toContain(`lang="${locale}"`)
  }
})
