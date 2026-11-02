/** Run with bun from the repository root. Article figures use the shared illustration renderer. */
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { socialHTML } from './scenes'

const scratch = await mkdtemp(join(tmpdir(), 'release-social-'))
const destination = new URL('../../../../public/images/blog/v2/social.png', import.meta.url)
const browser = await chromium.launch()
try {
  const file = join(scratch, 'social.html')
  await writeFile(file, socialHTML())
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'dark' })
  await page.goto(pathToFileURL(file).href)
  await page.evaluate(async () => {
    await Promise.all(['350 14px Geist', '400 68px Geist', '460 14px Geist'].map(font => document.fonts.load(font)))
    await document.fonts.ready
  })
  await mkdir(dirname(fileURLToPath(destination)), { recursive: true })
  await page.locator('.scene').screenshot({ path: fileURLToPath(destination) })
  console.log(fileURLToPath(destination))
} finally {
  await browser.close()
  await rm(scratch, { recursive: true, force: true })
}
