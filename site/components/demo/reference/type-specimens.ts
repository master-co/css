import type { DemoScene, ReferenceDemoSection } from './types'
import { escape, label } from './html'

const properties: Record<string, string[]> = {
  'font-family': ['font-family'], 'font-size': ['font-size', 'line-height'],
  'font-weight': ['font-weight'], 'font-style': ['font-style'],
  'font-feature-settings': ['font-feature-settings'], 'font-variant-numeric': ['font-variant-numeric'],
  'font-smooth': ['-webkit-font-smoothing', '-moz-osx-font-smoothing'],
  'letter-spacing': ['letter-spacing'], 'word-spacing': ['word-spacing'],
  'line-height': ['font-size', 'line-height'], 'vertical-align': ['vertical-align'],
  'text-size': ['font-size', 'line-height', 'letter-spacing'],
}

/** Keep authored inline contexts, inheritance, font resources and table structure intact. */
export function typeSpecimens(section: ReferenceDemoSection, options?: { properties: string[], caption: string, measure?: boolean, measureLabel?: string, pseudo?: string, appearance?: 'plain' }): DemoScene {
  const { page, id } = section
  let head = '', bodyClass = ''
  const html = section.html.map((source, index) => {
    const prefix = section.html.length > 1 ? `example-${index}-` : ''
    const title = source.match(/^<!-- ([^>]+) -->/)?.[1]
    head += source.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? ''
    const body = source.match(/<body(?: class="([^"]*)")?>([\s\S]*?)<\/body>/)
    if (body) { bodyClass = body[1] ?? ''; source = body[2] }
    const target = `${prefix}target`
    const ids = new Set([...source.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]))
    let content = source.replace(/\bid="([^"]+)"/g, (_, name: string) => `id="${prefix}${name}"${name === 'target' ? ` data-target data-ui="type-target"${options?.appearance ? ` data-appearance="${options.appearance}"` : ''}` : ''}`)
    // Independent comparisons scope both IDs and their native/accessible references.
    if (prefix) {
      content = content.replace(/\b(for|list|headers|aria-labelledby|aria-describedby|aria-controls|aria-activedescendant|aria-details|aria-errormessage|aria-owns|aria-flowto|popovertarget)="([^"]+)"/g,
        (_, attribute: string, value: string) => `${attribute}="${value.split(/\s+/).map(id => ids.has(id) ? prefix + id : id).join(' ')}"`)
      content = content.replace(/\bhref="#([^"]+)"/g, (attribute, id: string) => ids.has(id) ? `href="#${prefix}${id}"` : attribute)
    }
    const observed = options?.properties ?? (page === 'font-feature-settings' && id === 'prefer-semantic-numeric-utilities' ? [...properties[page], 'font-variant-numeric'] : properties[page])
    const readings = observed.map(property => `<span>${options?.pseudo ? `${escape(options.pseudo)} ` : ''}${property} <output data-style-readout="${target}" data-style-property="${property}" ${options?.pseudo ? `data-style-pseudo="${escape(options.pseudo)}" ` : ''}${/^(font-size|line-height)$/.test(property) ? 'data-round-pixels' : ''}${page === 'font-smooth' ? ' data-empty-value="Not exposed"' : ''}>—</output></span>`).join('')
    const runs = ['ones', 'eights', 'inherited'].filter(name => source.includes(`id="${name}"`)).map(name => `<span>${name} <output data-size-readout="${prefix}${name}">—</output></span>`).join('')
    const size = options?.measure ? `<span>${escape(options.measureLabel ?? 'Box')} <output data-size-readout="${target}">—</output></span>` : source.match(/id="target" class="[^"]*\binline-block\b/) && /letter-spacing|word-spacing/.test(page) ? `<span>Run box <output data-size-readout="${target}">—</output></span>` : ''
    const family = page === 'font-family' && id === 'google-fonts' ? 'Roboto'
      : page === 'font-family' && id === 'self-hosted-fonts' ? 'Geist'
        : page === 'font-variant-numeric' && id === 'show-slashed-zeroes' ? 'JetBrains Mono' : undefined
    const loading = family ? `<span>${escape(family)} <output data-font-status="${escape(family)}">Checking font…</output></span>` : ''
    return `<section data-ui="type-example" data-tone="${index % 2 ? 'violet' : 'blue'}">${title ? label(title) : ''}<div data-ui="type-surface">${content}</div><div data-ui="type-readings">${readings}${runs}${size}${loading}</div></section>`
  }).join('')
  const captions: Record<string, string> = {
    'font-family': 'The examples keep their real inheritance and font sources. A computed family list names the requested stack; it does not identify which face rendered every glyph.',
    'font-size': 'Read the computed font size and line height separately. The preview grows with its content, so a larger type size remains visible.',
    'font-weight': 'The local variable font supports 100–900. Every specimen keeps the same text; available faces determine the result in another family.',
    'font-style': id === 'reset-font-style' ? 'The blue child resets its inherited slant. The surrounding words keep their italic style.' : 'The readout follows the styled subject. The selected font and available faces determine whether the browser uses a designed or synthesized slant.',
    'font-feature-settings': 'Glyph-run measurements include the actual text advance. Raw feature settings are reported independently of numeric variants.',
    'font-variant-numeric': 'The selected font must support the feature. Compare actual digits as well as computed values; equal digit counts make advances comparable.',
    'font-smooth': 'Vendor property support and rasterization depend on the platform. “Not exposed” means this browser returns no computed value for that property.',
    'letter-spacing': 'The label, computed value and comparison stay outside the text context. Tracking can also change wrapping.',
    'line-height': 'The readout is the computed line height, not glyph height. Mixed sizes, inline objects and inherited values can affect the final line box.',
    'word-spacing': 'The value adds to the normal word separator. Compare the same content at the same size to isolate the effect.',
    'vertical-align': 'These are actual inline boxes and table cells. The annotations are outside the formatting context and cannot become extra inline content.',
    'text-size': 'One utility controls three properties. Compare the actual size, leading and tracking at the preview’s reading width.',
  }
  return { html, head, bodyClass, caption: options?.caption ?? captions[page], sizing: 'content', responsive: page === 'font-size' && id === 'use-an-explicit-font-size' || undefined, inspect: [] }
}
