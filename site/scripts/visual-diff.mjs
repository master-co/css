/**
 * Compare two same-sized PNG captures before opening either image.
 *
 * node site/scripts/visual-diff.mjs before.png after.png [--threshold 8] [--dpr 2] [--pad 24] [--pair pair.png]
 *
 * Prints the changed-pixel ratio, the changed region in image and CSS pixels, and the
 * largest channel difference. `--pair` writes the changed region of both captures side
 * by side at full resolution, so one focused image replaces two whole captures.
 */
import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    threshold: { type: 'string', default: '8' },
    dpr: { type: 'string', default: '2' },
    pad: { type: 'string', default: '24' },
    pair: { type: 'string' },
  },
})
const [before, after] = positionals
if (!before || !after) throw new Error('Pass the before and after PNG paths.')
const sources = await Promise.all([before, after].map(async file => `data:image/png;base64,${(await readFile(file)).toString('base64')}`))
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const result = await page.evaluate(async ([sources, threshold, pad, pair]) => {
    const images = await Promise.all(sources.map(async source => {
      const image = new Image()
      image.src = source
      await image.decode()
      return image
    }))
    const [width, height] = [images[0].naturalWidth, images[0].naturalHeight]
    if (images[1].naturalWidth !== width || images[1].naturalHeight !== height) {
      return { error: `Sizes differ: ${width}x${height} and ${images[1].naturalWidth}x${images[1].naturalHeight}.` }
    }
    const pixels = images.map(image => {
      const canvas = new OffscreenCanvas(width, height)
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      return context.getImageData(0, 0, width, height).data
    })
    let changed = 0
    let maxDelta = 0
    let [left, top, right, bottom] = [width, height, -1, -1]
    for (let index = 0; index < pixels[0].length; index += 4) {
      const delta = Math.max(...[0, 1, 2, 3].map(channel => Math.abs(pixels[0][index + channel] - pixels[1][index + channel])))
      maxDelta = Math.max(maxDelta, delta)
      if (delta <= threshold) continue
      changed++
      const x = (index / 4) % width
      const y = Math.floor(index / 4 / width)
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x)
      bottom = Math.max(bottom, y)
    }
    const region = changed ? { x: left, y: top, width: right - left + 1, height: bottom - top + 1 } : null
    let pairSource
    let pairSize
    if (pair && region) {
      const x = Math.max(0, region.x - pad)
      const y = Math.max(0, region.y - pad)
      const cropWidth = Math.min(width - x, region.width + pad * 2)
      const cropHeight = Math.min(height - y, region.height + pad * 2)
      const gap = 8
      const canvas = new OffscreenCanvas(cropWidth * 2 + gap, cropHeight)
      pairSize = { width: canvas.width, height: canvas.height }
      const context = canvas.getContext('2d')
      context.fillStyle = '#808080'
      context.fillRect(0, 0, canvas.width, canvas.height)
      images.forEach((image, side) => context.drawImage(image, x, y, cropWidth, cropHeight, side * (cropWidth + gap), 0, cropWidth, cropHeight))
      const blob = await canvas.convertToBlob({ type: 'image/png' })
      pairSource = await new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    }
    return { width, height, changedRatio: changed / (width * height), maxDelta, region, pairSource, pairSize }
  }, [sources, Number(options.threshold), Number(options.pad), !!options.pair])
  if (result.error) throw new Error(result.error)
  const { pairSource, pairSize, ...report } = result
  const dpr = Number(options.dpr)
  if (report.region) report.cssRegion = Object.fromEntries(Object.entries(report.region).map(([key, value]) => [key, Math.round(value / dpr)]))
  if (pairSource) {
    await writeFile(options.pair, Buffer.from(pairSource.split(',')[1], 'base64'))
    report.pair = options.pair
    // Image input is resized to a 2000px long edge; a wider pair loses the detail it was cropped for.
    if (Math.max(pairSize.width, pairSize.height) > 2000) report.warning = `The pair is ${pairSize.width}x${pairSize.height}px and is resized when viewed; capture a smaller region before comparing.`
  }
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
