/** The title is rasterized only when its layout changes; animation reuses this texture. */
export interface HeroTitleMask {
  pixels: Uint8Array
  width: number
  height: number
  left: number
  top: number
  cssWidth: number
  cssHeight: number
  fontSize: number
  range: number
}

/** Squared Euclidean distance, using the lower envelope of one-dimensional parabolas. */
function distanceTransform(grid: Float32Array, width: number, height: number) {
  const length = Math.max(width, height)
  const input = new Float32Array(length)
  const output = new Float32Array(length)
  const sites = new Int32Array(length)
  const bounds = new Float64Array(length + 1)
  const transform = (count: number) => {
    let last = 0
    sites[0] = 0
    bounds[0] = -Infinity
    bounds[1] = Infinity
    for (let q = 1; q < count; q++) {
      let intersection = 0
      do {
        const p = sites[last]
        intersection = (input[q] + q * q - input[p] - p * p) / (2 * (q - p))
        if (intersection > bounds[last]) break
        last--
      } while (last >= 0)
      sites[++last] = q
      bounds[last] = intersection
      bounds[last + 1] = Infinity
    }
    last = 0
    for (let q = 0; q < count; q++) {
      while (bounds[last + 1] < q) last++
      const delta = q - sites[last]
      output[q] = delta * delta + input[sites[last]]
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) input[y] = grid[y * width + x]
    transform(height)
    for (let y = 0; y < height; y++) grid[y * width + x] = output[y]
  }
  for (let y = 0; y < height; y++) {
    input.set(grid.subarray(y * width, (y + 1) * width))
    transform(width)
    grid.set(output.subarray(0, width), y * width)
  }
}

/** R: signed distance, GB: outward normal in screen coordinates, A: original glyph coverage. */
export function createTitleDistanceField(alpha: Uint8ClampedArray, width: number, height: number, ratio: number, range: number) {
  const count = width * height
  const outside = new Float32Array(count)
  const inside = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const filled = alpha[i * 4 + 3] >= 128
    outside[i] = filled ? 1e10 : 0
    inside[i] = filled ? 0 : 1e10
  }
  distanceTransform(outside, width, height)
  distanceTransform(inside, width, height)
  for (let i = 0; i < count; i++) {
    outside[i] = (Math.sqrt(outside[i]) - Math.sqrt(inside[i])) / ratio
  }
  const pixels = new Uint8Array(count * 4)
  const sampleRadius = Math.max(1, Math.round(ratio * 1.2))
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const dx = outside[y * width + Math.min(width - 1, x + sampleRadius)] - outside[y * width + Math.max(0, x - sampleRadius)]
      const dy = outside[Math.min(height - 1, y + sampleRadius) * width + x] - outside[Math.max(0, y - sampleRadius) * width + x]
      const magnitude = Math.hypot(dx, dy) || 1
      pixels[i * 4] = Math.round(Math.max(0, Math.min(1, 0.5 + outside[i] / (2 * range))) * 255)
      pixels[i * 4 + 1] = Math.round((0.5 - dx / magnitude * 0.5) * 255)
      pixels[i * 4 + 2] = Math.round((0.5 - dy / magnitude * 0.5) * 255)
      pixels[i * 4 + 3] = alpha[i * 4 + 3]
    }
  }
  return pixels
}

interface TextRun {
  text: string
  rect: DOMRect
  style: CSSStyleDeclaration
}

/** Use browser line breaks, including balanced text, nonbreaking spaces and mixed CJK/Latin runs. */
export function rasterizeHeroTitle(title: HTMLElement, canvas: HTMLCanvasElement, ratio: number, fontFamily: string): HeroTitleMask | null {
  const runs: TextRun[] = []
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let node: Node | null
  while ((node = walker.nextNode())) {
    const text = node.textContent ?? ''
    const style = getComputedStyle(node.parentElement!)
    let start = -1
    let top = 0
    const flush = (end: number) => {
      if (start < 0) return
      range.setStart(node!, start)
      range.setEnd(node!, end)
      runs.push({ text: text.slice(start, end), rect: range.getBoundingClientRect(), style })
      start = -1
    }
    for (let offset = 0; offset < text.length;) {
      const next = offset + (text.codePointAt(offset)! > 0xFFFF ? 2 : 1)
      range.setStart(node, offset)
      range.setEnd(node, next)
      const rect = range.getBoundingClientRect()
      if (rect.width > 0) {
        if (start >= 0 && Math.abs(rect.top - top) > 1) flush(offset)
        if (start < 0) {
          start = offset
          top = rect.top
        }
      } else if (start >= 0 && /^\s+$/.test(text.slice(offset, next))) {
        flush(offset)
      }
      offset = next
    }
    flush(text.length)
  }
  const visible = runs.filter((run) => run.text.trim())
  if (!visible.length) return null
  const padding = 8
  const left = Math.floor(Math.min(...visible.map((run) => run.rect.left))) - padding
  const top = Math.floor(Math.min(...visible.map((run) => run.rect.top))) - padding
  const cssWidth = Math.ceil(Math.max(...visible.map((run) => run.rect.right))) - left + padding
  const cssHeight = Math.ceil(Math.max(...visible.map((run) => run.rect.bottom))) - top + padding
  const mask = document.createElement('canvas')
  mask.width = Math.ceil(cssWidth * ratio)
  mask.height = Math.ceil(cssHeight * ratio)
  const context = mask.getContext('2d', { willReadFrequently: true })
  if (!context || !('letterSpacing' in context)) return null
  context.scale(ratio, ratio)
  context.fillStyle = '#fff'
  context.textBaseline = 'alphabetic'
  for (const run of visible) {
    context.font = `${run.style.fontStyle} ${run.style.fontWeight} ${run.style.fontSize} ${fontFamily}`
    context.letterSpacing = run.style.letterSpacing
    context.fontKerning = 'normal'
    const metrics = context.measureText(run.text)
    context.fillText(run.text, run.rect.left - left, run.rect.top - top + metrics.fontBoundingBoxAscent)
  }
  const fontSize = parseFloat(getComputedStyle(title).fontSize)
  const distanceRange = Math.max(6, fontSize * 0.16)
  const rect = canvas.getBoundingClientRect()
  return {
    pixels: createTitleDistanceField(context.getImageData(0, 0, mask.width, mask.height).data, mask.width, mask.height, ratio, distanceRange),
    width: mask.width,
    height: mask.height,
    left: left - rect.left,
    top: top - rect.top,
    cssWidth: mask.width / ratio,
    cssHeight: mask.height / ratio,
    fontSize,
    range: distanceRange
  }
}
