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
    // Content-attached annotations are resolved only for the exported bitmap; articles need no diagram JavaScript.
    await page.evaluate(() => {
      const origin = document.querySelector('.scene')!.getBoundingClientRect()
      const bounds = (id: string) => {
        const matches = [...document.querySelectorAll<HTMLElement>('[data-anchor]')].filter(el => el.dataset.anchor === id)
        if (matches.length !== 1) throw new Error(`Expected one illustration anchor: ${id}`)
        return matches[0].getBoundingClientRect()
      }
      for (const path of document.querySelectorAll<SVGPathElement>('path[data-from]')) {
        const source = bounds(path.dataset.from!)
        const target = bounds(path.dataset.to!)
        const sx = source.left + source.width / 2 - origin.left
        const sy = source.bottom - origin.top
        const tx = target.left + target.width / 2 - origin.left
        const ty = target.top - origin.top - 10
        const via = Number(path.dataset.viaY)
        if (!(sy < via && via < ty)) throw new Error(`Leader corridor overlaps its labels: ${path.dataset.from}`)
        const direction = Math.sign(tx - sx)
        const radius = Math.min(8, Math.abs(tx - sx) / 2, (via - sy) / 2, (ty - via) / 2)
        path.setAttribute('d', direction === 0 ? `M${sx} ${sy}V${ty}`
          : `M${sx} ${sy}V${via - radius}Q${sx} ${via} ${sx + direction * radius} ${via}H${tx - direction * radius}Q${tx} ${via} ${tx} ${via + radius}V${ty}`)
      }
    })
    const overflow = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-label]')]
      .filter(element => {
        const bounds = element.getBoundingClientRect()
        return element.scrollWidth > element.clientWidth + 1 || bounds.right > innerWidth || bounds.left < 0 || bounds.top < 0 || bounds.bottom > innerHeight
      })
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
