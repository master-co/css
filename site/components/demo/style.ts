/** A style declaration as Svelte renders it: text, or an object such as `.astro` callers write. */
export type DemoStyle = string | Record<string, string | number | null | undefined>

const unitless = /^(?:--|opacity$|z-?index$|flex(?:-?grow|-?shrink)?$|order$|font-?weight$|line-?height$|zoom$|scale$|aspect-?ratio$)/i

/** Object styles follow Astro's style objects: camelCase names become kebab-case, and numbers on length properties become pixels. */
export function styleText(style: DemoStyle | null | undefined) {
  if (style == null || typeof style === 'string') return style || undefined
  const declarations = Object.entries(style).flatMap(([name, value]) => {
    if (value == null || value === '') return []
    const property = name.startsWith('--') ? name : name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
    return [`${property}:${typeof value === 'number' && value !== 0 && !unitless.test(name) ? `${value}px` : value}`]
  })
  return declarations.join(';') || undefined
}
