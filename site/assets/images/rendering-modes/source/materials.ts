/** Neutral surfaces shared by the documentation illustration scenes. */
export type Theme = 'light' | 'dark'

export const palettes = {
  light: {
    canvas: '#fafafa', ink: '#292929', muted: '#626262', quiet: '#8c8c8c',
    top: '#ffffff', bottom: '#f4f4f4',
    edgeTop: '#b5b5b5', edgeBottom: '#d5d5d5', line: '#dcdcdc',
    inset: '#f4f4f4', window: '#ffffff', chrome: '#f5f5f5',
    block: '#e5e5e5', blockStrong: '#b6b6b6', button: '#454545',
    route: '#8a8a8a', highlight: '#ffffff', zone: '#f0f0f0', shadow: '#000000'
  },
  dark: {
    canvas: '#111111', ink: '#e5e5e5', muted: '#ababab', quiet: '#747474',
    top: '#303030', bottom: '#222222',
    edgeTop: '#696969', edgeBottom: '#3c3c3c', line: '#414141',
    inset: '#202020', window: '#252525', chrome: '#2e2e2e',
    block: '#3e3e3e', blockStrong: '#646464', button: '#bcbcbc',
    route: '#898989', highlight: '#ffffff', zone: '#1b1b1b', shadow: '#000000'
  }
} as const

export function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)
}

export function drawing(theme: Theme) {
  const p = palettes[theme]
  const dark = theme === 'dark'
  const text = (x: number, y: number, value: string, size = 17, color: string = p.ink, weight = 400, extra = '') =>
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" ${extra}>${escapeXml(value)}</text>`
  const rect = (x: number, y: number, width: number, height: number, radius: number, fill: string, extra = '') =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" ${extra}/>`
  const line = (d: string, extra = '') => `<path d="${d}" fill="none" stroke="${p.route}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
  const surface = (x: number, y: number, width: number, height: number, radius = 10) =>
    rect(x, y, width, height, radius, 'url(#surface)', 'stroke="url(#edge)" filter="url(#shadow)"')
      + rect(x + 1, y + 1, width - 2, height - 2, radius - 1, 'none', `stroke="${p.highlight}" stroke-opacity="${dark ? '.05' : '.7'}"`)

  function document(x: number, y: number, width: number, height: number, label: string, cssLabel: string) {
    const fold = 24
    return `<g>
      <path d="M${x + 10} ${y}H${x + width - fold}L${x + width} ${y + fold}V${y + height - 10}Q${x + width} ${y + height} ${x + width - 10} ${y + height}H${x + 10}Q${x} ${y + height} ${x} ${y + height - 10}V${y + 10}Q${x} ${y} ${x + 10} ${y}Z" fill="url(#surface)" stroke="url(#edge)" filter="url(#shadow)"/>
      <path d="M${x + width - fold} ${y + 1}V${y + fold - 5}Q${x + width - fold} ${y + fold} ${x + width - fold + 5} ${y + fold}H${x + width - 1}" fill="none" stroke="${p.edgeBottom}"/>
      ${text(x + 18, y + 45, label, 20, p.ink, 500)}
      <g stroke="${p.quiet}" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M${x + 27} ${y + 62}l-7 7 7 7m20-14 7 7-7 7m-8-17-4 20"/>
      </g>
      ${rect(x + 69, y + 64, width - 92, 5, 2.5, p.block)}
      ${rect(x + 69, y + 76, width - 111, 5, 2.5, p.block)}
      ${rect(x + 20, y + 96, width - 40, 5, 2.5, p.block)}
      ${rect(x + 20, y + 108, width - 68, 5, 2.5, p.block)}
      <path d="M${x + 1} ${y + height - 62}H${x + width - 1}V${y + height - 10}Q${x + width - 1} ${y + height - 1} ${x + width - 10} ${y + height - 1}H${x + 10}Q${x + 1} ${y + height - 1} ${x + 1} ${y + height - 10}Z" fill="${p.inset}"/>
      <path d="M${x + 1} ${y + height - 62}H${x + width - 1}" stroke="${p.line}"/>
      <g transform="translate(${x + 20} ${y + height - 41})" fill="none" stroke="${p.quiet}" stroke-width="1.2" stroke-linejoin="round">
        <path d="M1 0h10l5 5v14H1ZM11 0v5h5M5 10h7M5 14h7"/>
      </g>
      ${text(x + 48, y + height - 25, cssLabel, 18)}
    </g>`
  }

  function browser(x: number, y: number, width: number, height: number, label?: string) {
    return `<g>
      ${surface(x, y, width, height)}
      ${rect(x + 1, y + 1, width - 2, 30, 9, p.chrome)}
      ${rect(x + 1, y + 20, width - 2, 11, 0, p.chrome)}
      <path d="M${x} ${y + 31}H${x + width}" stroke="${p.line}"/>
      ${[15, 25, 35].map(dx => `<circle cx="${x + dx}" cy="${y + 16}" r="2" fill="${p.quiet}"/>`).join('')}
      ${rect(x + 63, y + 11, width - 115, 10, 3, p.inset, `stroke="${p.line}" stroke-width=".6"`)}
      ${rect(x + 17, y + 48, 30, height - 66, 4, p.inset)}
      ${[61, 76, 91].map(dy => rect(x + 24, y + dy, 16, 3, 1.5, p.blockStrong)).join('')}
      ${label ? text(x + 64, y + 74, label, 18, p.ink, 500) : rect(x + 64, y + 63, 100, 7, 3.5, p.blockStrong)}
      ${rect(x + 64, y + 90, width - 92, 4, 2, p.block)}
      ${rect(x + 64, y + 101, width - 117, 4, 2, p.block)}
      ${rect(x + 64, y + 119, 64, 18, 4, p.button)}
    </g>`
  }

  function engine(x: number, y: number, width: number, height: number, label: string, subtitle?: string) {
    return `<g>
      ${[18, 32, 46].map(dy => line(`M${x - 5} ${y + dy}h5m${width} 0h5`, `stroke-opacity=".45"`)).join('')}
      ${surface(x, y, width, height, 8)}
      <g transform="translate(${x + 16} ${y + height / 2 - 10})" stroke="${p.quiet}" stroke-width="1.2" fill="none" stroke-linecap="round">
        <rect x="1" y="1" width="18" height="18" rx="3"/>
        <rect x="6" y="6" width="8" height="8" rx="1"/>
        <path d="M6-2v3m8-3v3M6 19v3m8-3v3M-2 6h3m-3 8h3M19 6h3m-3 8h3"/>
      </g>
      ${text(x + 48, y + (subtitle ? 25 : height / 2 + 6), label, 18, p.ink, 500)}
      ${subtitle ? text(x + 48, y + 48, subtitle, 15, p.muted) : ''}
    </g>`
  }

  function stylesheet(x: number, y: number, width: number, height: number, label: string) {
    return `<g>
      ${rect(x + 6, y + 6, width - 12, height, 8, p.inset, `stroke="${p.line}"`)}
      ${surface(x, y, width, height, 8)}
      ${text(x + 18, y + 34, label, 18, p.ink, 500)}
      <path d="M${x + 1} ${y + 51}H${x + width - 1}" stroke="${p.line}"/>
      ${[69, 87, 105].map((dy, i) => rect(x + 18, y + dy, width - 50 - i * 20, 4, 2, p.blockStrong, 'opacity=".65"')).join('')}
    </g>`
  }

  function svg(width: number, height: number, title: string, description: string, content: string, padding: number) {
    const outerWidth = width + padding * 2
    const outerHeight = height + padding * 2
    const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${outerWidth}" height="${outerHeight}" viewBox="0 0 ${outerWidth} ${outerHeight}" role="img" aria-labelledby="title description" font-family="Geist, sans-serif">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">${escapeXml(description)}</desc>
  <defs>
    <linearGradient id="surface" x2=".2" y2="1"><stop stop-color="${p.top}"/><stop offset="1" stop-color="${p.bottom}"/></linearGradient>
    <linearGradient id="edge" x2=".65" y2="1"><stop stop-color="${p.edgeTop}"/><stop offset="1" stop-color="${p.edgeBottom}"/></linearGradient>
    <filter id="shadow" x="-40%" y="-40%" width="180%" height="200%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="${p.shadow}" flood-opacity="${dark ? '.14' : '.04'}"/>
      <feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="${p.shadow}" flood-opacity="${dark ? '.16' : '.035'}"/>
    </filter>
    <marker id="arrow" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M2 1l4 3-4 3" fill="none" stroke="${p.route}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></marker>
  </defs>
  ${rect(0, 0, outerWidth, outerHeight, 0, p.canvas)}
  <g transform="translate(${padding} ${padding})">${content}</g>
</svg>\n`
    return { width: outerWidth, height: outerHeight, svg: source.replace(/[\t ]+$/gm, '') }
  }
  return { p, text, rect, line, surface, document, browser, engine, stylesheet, svg }
}
