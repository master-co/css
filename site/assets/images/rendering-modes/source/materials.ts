/** Illustration primitives shared by the documentation scenes, painted by the site's tokens in `illustration.css`. */
export type Theme = 'light' | 'dark'

/** The scene is drawn at the article's wide media width, so its sizes match the interface around it. */
export const sceneWidth = 720
export const sceneHeight = 480

/** Tabler outline icons, the set the site's interface uses. */
const icons = {
  braces: ['M7 4a2 2 0 0 0 -2 2v3a2 3 0 0 1 -2 3a2 3 0 0 1 2 3v3a2 2 0 0 0 2 2', 'M17 4a2 2 0 0 1 2 2v3a2 3 0 0 0 2 3a2 3 0 0 0 -2 3v3a2 2 0 0 1 -2 2'],
  check: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M9 12l2 2l4 -4'],
  code: ['M7 8l-4 4l4 4', 'M17 8l4 4l-4 4', 'M14 4l-4 16'],
  compare: ['M4 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M16 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M11 6h5a2 2 0 0 1 2 2v8', 'M14 9l-3 -3l3 -3', 'M13 18h-5a2 2 0 0 1 -2 -2v-8', 'M10 15l3 3l-3 3'],
  cpu: ['M5 6a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -12', 'M9 9h6v6h-6l0 -6', 'M3 10h2', 'M3 14h2', 'M10 3v2', 'M14 3v2', 'M21 10h-2', 'M21 14h-2', 'M14 21v-2', 'M10 21v-2'],
  file: ['M14 3v4a1 1 0 0 0 1 1h4', 'M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2', 'M9 17h6', 'M9 13h6'],
  fileCode: ['M14 3v4a1 1 0 0 0 1 1h4', 'M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2', 'M10 13l-1 2l1 2', 'M14 13l1 2l-1 2'],
  filter: ['M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227'],
  layers: ['M12 4l-8 4l8 4l8 -4l-8 -4', 'M4 12l8 4l8 -4', 'M4 16l8 4l8 -4'],
  refresh: ['M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4', 'M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4'],
  scan: ['M5 12h14', 'M3 7v-2a2 2 0 0 1 2 -2h2', 'M3 17v2a2 2 0 0 0 2 2h2', 'M17 3h2a2 2 0 0 1 2 2v2', 'M17 21h2a2 2 0 0 0 2 -2v-2'],
  server: ['M3 7a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-2', 'M3 15a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3l0 -2', 'M7 8l0 .01', 'M7 16l0 .01'],
  window: ['M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10', 'M6 8h.01', 'M9 8h.01']
} as const

export type IconName = keyof typeof icons
export type TextKind = 'title' | 'note' | 'body' | 'edge' | 'code' | 'eyebrow'
type Align = 'start' | 'center' | 'end'
type AnnotationTone = 'blue' | 'violet' | 'amber'

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

const box = (x: number, y: number, width?: number, height?: number) =>
  `left:${x}px;top:${y}px;${width === undefined ? '' : `width:${width}px;`}${height === undefined ? '' : `height:${height}px;`}`

export function drawing(theme: Theme) {
  const routes: string[] = []
  const icon = (name: IconName) => `<span class="icon"><svg viewBox="0 0 24 24">${icons[name].map(d => `<path d="${d}"/>`).join('')}</svg></span>`
  /** A label inside a sheet, chip or mark; every label carries a shared figure label. */
  const label = (value: string, kind: TextKind = 'title') => `<span class="${kind}" data-label>${escapeHtml(value)}</span>`
  /** A free label, its box's top edge at y, anchored at x. */
  const text = (x: number, y: number, value: string, kind: TextKind = 'note', align: Align = 'start') =>
    `<span class="${kind}${align === 'start' ? '' : ` ${align}`}" style="${box(x, y)}" data-label>${escapeHtml(value)}</span>`
  const row = (content: string) => `<div class="row">${content}</div>`
  const rule = '<div class="rule"></div>'
  /** Placeholder lines for content the figure does not spell out, as percentages of the sheet's inner width. */
  const bars = (...widths: number[]) => `<div class="bars">${widths.map(width => `<i style="width:${width}%"></i>`).join('')}</div>`
  /** Omit dimensions for intrinsic content sizing; an anchor keeps positioning independent of the resulting width. */
  const sheet = (x: number, y: number, width: number | undefined, height: number | undefined, content: string, anchor: Align = 'start') =>
    `<div class="sheet${anchor === 'start' ? '' : ` anchor-${anchor}`}" style="${box(x, y, width, height)}">${content}</div>`
  const chip = (x: number, y: number, width: number | undefined, name: IconName, value: string) =>
    `<div class="chip" style="${box(x, y, width)}">${icon(name)}<span data-label>${escapeHtml(value)}</span></div>`
  const mark = (x: number, y: number, name: IconName, value: string, align: Align = 'start') =>
    `<div class="mark${align === 'start' ? '' : ` ${align}`}" style="${box(x, y)}">${icon(name)}${label(value)}</div>`
  /** A vertical hairline between two places; caption each side with an eyebrow `text`. */
  const divider = (x: number, top: number, bottom: number) => `<i class="divider" style="${box(x, top, undefined, bottom - top)}"></i>`
  const window = (x: number, y: number, width: number, height: number, content = '') =>
    `<div class="window" style="${box(x, y, width, height)}"><div class="toolbar"><i></i><i></i><i></i></div>${content}</div>`
  /** A measured control specimen: center anchored, with its real padding exposed by inspection guides. */
  const spacingControl = (x: number, y: number, value: string, padding: number, measurement: string, accent = false) =>
    `<div class="spacing-study${accent ? ' accented' : ''}" style="${box(x, y)}--sample-padding:${padding}px">
      <div class="spacing-control"><i class="padding-start"></i>${label(value, 'body')}<i class="padding-end"></i></div>
      <div class="spacing-ruler"><i></i>${label(measurement, 'edge')}<i></i></div>
    </div>`
  /** Matched article specimens isolate selector attachment under the same pointer state. */
  const selectorSpecimen = (x: number, y: number, test: 'owner' | 'target', title: string, firstLink: string, secondLink: string) =>
    `<article class="sheet selector-specimen anchor-center" data-test="${test}" style="${box(x, y)}">
      <p>${label(title)}</p>
      <a>${label(firstLink, 'body')}<svg class="selector-pointer" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3l15 9-7 1-3 7z"/></svg></a>
      <a>${label(secondLink, 'body')}</a>
    </article>`
  /** Measured query boundaries share one width scale; heights still follow content. */
  const queryScopes = (x: number, y: number, viewportWidth: number, containerWidth: number, labels: {
    viewport: string; media: string; viewportWidth: string; container: string; query: string; containerWidth: string; child: string
  }) => `<div class="query-scopes anchor-center" style="${box(x, y, viewportWidth)}">
    <div class="query-ruler">${label(labels.viewportWidth, 'code')}</div>
    <div class="query-viewport">
      <div class="query-scope-heading">${label(labels.viewport)}${label(labels.media, 'code')}</div>
      <div class="query-container-study" style="width:${containerWidth}px">
        <div class="query-ruler">${label(labels.containerWidth, 'code')}</div>
        <div class="query-container">${label(labels.container)}${label(labels.query, 'code')}<div class="query-descendant">${label(labels.child, 'body')}</div></div>
      </div>
    </div>
  </div>`
  /** A file's current contribution; a removed source loses its solid artifact and connection. */
  const sourceContribution = (x: number, y: number, name: string, source: string, removed = false) =>
    `<div class="sheet source-contribution anchor-center" style="${box(x, y)}"${removed ? ' data-removed' : ''}>${row(icon('fileCode') + label(name))}${row(label(source, 'code'))}</div>`
  /** An ordered layer list; unlayered CSS is separated because it is not a sixth named layer. */
  const priorityStack = (x: number, y: number, layers: readonly string[], unlayered: string) =>
    `<div class="priority-stack anchor-center" style="${box(x, y)}">${layers.map(value => `<div>${label(value, 'code')}</div>`).join('')}<div class="unlayered">${label(unlayered, 'body')}</div></div>`
  /** Two DOM scopes expose inherited computed values; sample paint is the literal result being compared. */
  const variableScope = (x: number, y: number, inline: boolean, labels: {
    root: string; rootValue: string; resolved: string; omitted: string; region: string; regionValue: string; sample: string; blue: string; plum: string
  }) => `<div class="variable-scope anchor-center" style="${box(x, y)}" data-inline="${inline}">
    ${label(labels.root, 'code')}${label(labels.rootValue, 'code')}${label(inline ? labels.omitted : labels.resolved, inline ? 'edge' : 'code')}
    <div class="variable-region">${label(labels.region, 'code')}${label(labels.regionValue, 'code')}
      <div class="variable-sample">${label(labels.sample, 'code')}</div>
      ${label(inline ? labels.plum : labels.blue, 'note')}
    </div>
  </div>`
  /** A native CSS block: indentation and a scope guide expose containment, not execution order. */
  const codeScope = (opening: string, content: string, tone?: AnnotationTone) =>
    `<div class="code-scope"${tone ? ` data-tone="${tone}"` : ''}>${label(opening, 'code')}<div class="code-scope-body">${content}</div>${label('}', 'code')}</div>`
  /** Equal swatches compare actual preset paint; the marked one is an alias target. */
  const colorScale = (x: number, y: number, hue: string, steps: readonly string[], selected: number, tone: AnnotationTone) =>
    `<div class="color-scale anchor-center" data-tone="${tone}" style="${box(x, y)}">${steps.map(step => `<div class="color-scale-step"><i class="bg-${hue}-${step}"${Number(step) === selected ? ` data-selected data-anchor="${hue}-selected"` : ''}></i>${label(step, 'code')}</div>`).join('')}</div>`
  /** Matched content and geometry isolate native light-dark() selection. */
  const roleSelection = (x: number, y: number, mode: Theme, heading: string, sample: string, surface: string, tone: AnnotationTone) =>
    `<div class="role-selection anchor-center" data-tone="${tone}" style="${box(x, y)}">
      <span class="code" data-label data-anchor="${mode}-scheme">${escapeHtml(heading)}</span>
      <div class="role-selection-sample bg-surface-base" style="color-scheme:${mode}"><span class="fg-text-muted" data-label>${escapeHtml(sample)}</span></div>
      ${label(surface, 'edge')}
    </div>`
  /** Adjacent literal fragments preserve the original string; each bracket follows its fragment's intrinsic width. */
  const codeParts = (x: number, y: number, parts: ({ id: string, value: string, tone: AnnotationTone } | { value: string })[]) =>
    `<div class="annotated-code anchor-center" style="${box(x, y)}">${parts.map(part =>
      'id' in part
        ? `<span class="code-part" data-tone="${part.tone}">${label(part.value, 'code')}<i class="code-bracket" data-anchor="${escapeHtml(part.id)}"></i></span>`
        : `<span class="code-part">${label(part.value, 'code')}</span>`).join('')}</div>`
  const annotation = (x: number, y: number, id: string, title: string, detail: string, tone: AnnotationTone) =>
    `<div class="annotation anchor-center" style="${box(x, y)}" data-tone="${tone}"><span class="title" data-label data-anchor="${escapeHtml(id)}">${escapeHtml(title)}</span>${label(detail, 'note')}</div>`
  /** The renderer resolves these leaders after fonts load, so they attach to actual content rather than estimated coordinates. */
  const leader = (from: string, to: string, viaY: number, tone: AnnotationTone) => {
    routes.push(`<path data-from="${escapeHtml(from)}" data-to="${escapeHtml(to)}" data-via-y="${viaY}" data-tone="${tone}"/>`)
    return ''
  }
  /** A connector in scene coordinates: arrowed unless it only joins other routes, dashed only for a labelled condition. */
  const route = (d: string, { arrow = true, dashed = false, emphasis = false } = {}) => {
    routes.push(`<path d="${d}"${arrow ? ` marker-end="url(#${emphasis ? 'arrow-emphasis' : 'arrow'})"` : ''}${emphasis ? ' data-emphasis' : ''}${dashed ? ' data-dashed' : ''}/>`)
    return ''
  }

  function scene(title: string, description: string, content: string) {
    const asset = (path: string) => new URL(path, import.meta.url).href
    const html = `<!doctype html>
<html lang="en" class="${theme}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${asset('../../../../styles/system/tokens.css')}">
<link rel="stylesheet" href="${asset('./illustration.css')}">
</head>
<body>
<main class="scene" style="width:${sceneWidth}px;height:${sceneHeight}px" role="img" aria-label="${escapeHtml(description)}">
<svg class="routes" width="${sceneWidth}" height="${sceneHeight}" viewBox="0 0 ${sceneWidth} ${sceneHeight}" aria-hidden="true">
<defs><marker id="arrow" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M2.5 1l4 3-4 3"/></marker><marker id="arrow-emphasis" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M2.5 1l4 3-4 3"/></marker></defs>
${routes.join('\n')}
</svg>
${content}
</main>
</body>
</html>
`
    return { width: sceneWidth, height: sceneHeight, title, description, html }
  }

  return { theme, icon, label, text, row, rule, bars, sheet, chip, mark, divider, window, spacingControl, selectorSpecimen, queryScopes, sourceContribution, priorityStack, variableScope, codeScope, colorScale, roleSelection, codeParts, annotation, leader, route, scene }
}
