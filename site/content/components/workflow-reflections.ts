export interface Reflection {
  light: HTMLCanvasElement
  dark: HTMLCanvasElement
  width: number
}

/** Derive a small neutral reflection from the real SVG silhouette. No second set of brand assets. */
export async function workflowReflections(scene: HTMLElement): Promise<(Reflection | undefined)[]> {
  return Promise.all([...scene.querySelectorAll<SVGSVGElement>('.home-wf-framework-logo')].map(async (svg) => {
    const source = svg.cloneNode(true) as SVGSVGElement
    source.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    source.setAttribute('width', '64')
    source.setAttribute('height', '64')
    source.removeAttribute('class')
    source.setAttribute('color', 'black')
    const image = new Image()
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(source))}`
    try { await image.decode() } catch { return }
    const mask = (color: string) => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 64
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(image, 0, 0, 64, 64)
      ctx.globalCompositeOperation = 'source-in'
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 64, 64)
      // The bottom of the source meets the glass after projection; the distant silhouette
      // dissolves into the surface. Bake the mask once, rather than adding a frame buffer.
      ctx.globalCompositeOperation = 'destination-in'
      const fade = ctx.createLinearGradient(0, 0, 0, 64)
      fade.addColorStop(0, 'rgb(0 0 0 / 0)')
      fade.addColorStop(.16, 'rgb(0 0 0 / .04)')
      fade.addColorStop(.4, 'rgb(0 0 0 / .24)')
      fade.addColorStop(.72, 'rgb(0 0 0 / .66)')
      fade.addColorStop(1, 'black')
      ctx.fillStyle = fade
      ctx.fillRect(0, 0, 64, 64)
      return canvas
    }
    const light = mask('black'), dark = mask('white')
    if (light && dark) return { light, dark, width: svg.getBoundingClientRect().width }
  }))
}
