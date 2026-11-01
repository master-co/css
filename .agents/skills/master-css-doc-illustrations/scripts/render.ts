/** Render an authored scene in the repository's Playwright Chromium, with the site's tokens and Geist variable font. */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const [sceneFile, destination] = process.argv.slice(2)
if (!sceneFile || !destination) {
  throw new Error('Usage: bun .agents/skills/master-css-doc-illustrations/scripts/render.ts <scene.ts> <output-directory>')
}
const scene = (await import(pathToFileURL(resolve(sceneFile)).href)).default as {
  id: string
  render(theme: 'light' | 'dark'): { width: number, height: number, html: string }
}
if (!/^[a-z][a-z0-9-]*$/.test(scene.id)) throw new Error('Scene id must be a kebab-case filename stem')
const output = resolve(destination)
await mkdir(output, { recursive: true })
const scratch = await mkdtemp(join(tmpdir(), 'illustration-'))
const browser = await chromium.launch()

try {
  for (const theme of ['light', 'dark'] as const) {
    const { width, height, html } = scene.render(theme)
    if (width * 2 !== height * 3) throw new Error(`${scene.id}: the scene must be a landscape 3:2 canvas`)
    const stem = `${scene.id}-${theme}`
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: theme })
    const file = join(scratch, `${stem}.html`)
    await writeFile(file, html)
    await page.goto(pathToFileURL(file).href)
    const missing = await page.evaluate(async fonts => {
      await Promise.all(fonts.map(font => document.fonts.load(font)))
      await document.fonts.ready
      return fonts.filter(font => !document.fonts.check(font))
    }, ['350 14px Geist', '460 14px Geist', '12.5px "IBM Plex Mono"'])
    if (missing.length) throw new Error(`${stem}: fonts did not load: ${missing.join(', ')}`)
    const overflow = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-label]')]
      .filter(element => element.scrollWidth > element.clientWidth + 1 || element.getBoundingClientRect().right > innerWidth || element.getBoundingClientRect().left < 0)
      .map(element => element.textContent))
    if (overflow.length) throw new Error(`${stem}: labels overflow their box or the canvas: ${overflow.join(', ')}`)
    const png = await page.locator('.scene').screenshot()
    await page.close()
    if (png.readUInt32BE(16) !== width * 2 || png.readUInt32BE(20) !== height * 2) throw new Error(`Unexpected output dimensions for ${stem}`)
    await writeFile(join(output, `${stem}.png`), png)
    console.log(`${stem}: ${width * 2} × ${height * 2}`)
  }
} finally {
  await browser.close()
  await rm(scratch, { recursive: true, force: true })
}
