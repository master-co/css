import { expect, test } from '@playwright/test'
import { referenceDemoCoverage } from '../../components/demo/reference/coverage'

const pages = Object.entries(referenceDemoCoverage).sort(([a], [b]) => a.localeCompare(b))
const batchSize = 20

if (pages.length !== 183) throw new Error(`Expected 183 utility references; found ${pages.length}.`)

for (let start = 0; start < pages.length; start += batchSize) {
  const batch = pages.slice(start, start + batchSize)
  test(`utility references ${start + 1}–${start + batch.length} render every section without overflow or browser errors`, async ({ context }) => {
    test.setTimeout(8 * 60_000)
    const failures: string[] = []

    for (const [name, sections] of batch) {
      const page = await context.newPage()
      page.on('pageerror', error => failures.push(`${name}: ${error.message}`))
      page.on('console', message => {
        if (message.type() === 'error') failures.push(`${name}: ${message.text()}`)
      })
      try {
        const response = await page.goto(`/en/reference/${name}`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
        if (response?.status() !== 200) {
          failures.push(`${name}: HTTP ${response?.status() ?? 'no response'}`)
          continue
        }
        await page.waitForFunction(() => !document.documentElement.hasAttribute('hidden'), null, { timeout: 10_000 })
        const result = await page.evaluate(({ name, sections }) => {
          const mounted = [...document.querySelectorAll<HTMLElement>('[data-demo-case]')].map(element => element.dataset.demoCase)
          const expected = sections.map(section => `${name}#${section}`)
          return {
            mounted,
            expected,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            title: document.querySelector('h1')?.textContent?.trim() ?? ''
          }
        }, { name, sections })
        if (!result.title) failures.push(`${name}: missing page heading`)
        if (result.overflow > 1) failures.push(`${name}: page overflows by ${result.overflow}px`)
        if (result.mounted.join('|') !== result.expected.join('|')) {
          failures.push(`${name}: demo sections differ; expected ${result.expected.join(', ')}, got ${result.mounted.join(', ')}`)
        }
      } catch (error) {
        failures.push(`${name}: ${(error as Error).message}`)
      } finally {
        await page.close()
      }
    }

    expect(failures).toEqual([])
  })
}
