import { readFileSync } from 'node:fs'
import { drawing, type Theme } from '../../rendering-modes/source/materials'
import { releaseFigures, type ReleaseFigureName } from '../../../../content/blog/v2/illustrations'
import { fieldworkMarkup, fieldworkSource, themeSource, releaseTheme, componentSource, componentMarkup } from '../../../../content/blog/v2/examples'
import { configuredExampleCSS, configuredMarkupClasses } from '../../../../reference/configured-example'

import { leadStory, publication } from '../../../../content/blog/v2/stories'

type Drawing = ReturnType<typeof drawing>

function inlinePhotos(markup: string) {
  return markup.replace(/src="(\/images\/blog\/v2\/[^"]+)"/g, (_, path) => `src="data:${path.endsWith('.webp') ? 'image/webp' : 'image/jpeg'};base64,${readFileSync(new URL(`../../../../public${path}`, import.meta.url)).toString('base64')}"`)
}

function fieldwork(d: Drawing) {
  const markup = fieldworkMarkup.replace(/<(span|p|h2|h3)\b/g, '<$1 data-label')
  return `<div class="release-board">${inlinePhotos(markup)}</div>`
}

function anatomy(d: Drawing) {
  return d.text(360, 56, 'A state and a condition, attached to one value', 'eyebrow', 'center')
    + '<div class="release-anatomy-source"><span class="edge" data-label>HTML / class attribute</span></div>'
    + d.codeParts(360, 122, [
      { id: 'color', value: 'fg-blue-70', tone: 'blue' },
      { id: 'state', value: ':hover', tone: 'violet' },
      { id: 'media', value: '@sm', tone: 'amber' }
    ])
    + d.annotation(155, 230, 'color-note', 'Color token', '--color-blue-70', 'blue')
    + d.annotation(360, 230, 'state-note', 'Element state', 'While hovered', 'violet')
    + d.annotation(565, 230, 'media-note', 'Media condition', 'Width ≥ 52.125rem', 'amber')
    + d.leader('color', 'color-note', 195, 'blue')
    + d.leader('state', 'state-note', 182, 'violet')
    + d.leader('media', 'media-note', 195, 'amber')
    + d.sheet(360, 306, undefined, undefined,
      d.row(d.icon('fileCode') + d.label('Generated CSS'))
      + d.codeScope('@media (width >= 52.125rem) {',
        d.codeScope('.fg-blue-70\\:hover\\@sm:hover {', '<span class="code release-color-value" data-label>color: var(--color-blue-70);</span>', 'violet'), 'amber'), 'center')
}

const tokenMarkup = `<article class="overflow-hidden r-lg bg-surface-raised fg-text-body"><img src="${leadStory.image.src}" alt="${leadStory.image.alt}" width="${leadStory.image.width}" height="${leadStory.image.height}"><div class="grid gap-sm p-story"><p class="m(0) text-xs fg-brand" data-label>${publication.name} / Issue ${publication.issue}</p><h3 class="m(0) text-lg font-regular fg-text-strong" data-label>${leadStory.title}</h3><p class="m(0) text-xs fg-text-muted" data-label>Spaces / At home · Field note 01</p></div></article>`

function tokens(d: Drawing) {
  return d.sheet(360, 30, undefined, undefined,
    d.row(d.icon('fileCode') + d.label('app.css') + '<span class="release-file-note">Project tokens</span>')
    + d.codeScope('@theme {', d.row(d.label(`--color-brand: light-dark(${releaseTheme.light}, ${releaseTheme.dark});`, 'code'))
      + d.row(d.label(`--spacing-story: ${releaseTheme.inset};`, 'code'))), 'center')
    + d.route('M360 164V178H192V204') + d.route('M360 178H528V204')
    + d.text(192, 213, 'Light scheme', 'eyebrow', 'center') + d.text(528, 213, 'Dark scheme', 'eyebrow', 'center')
    + `<div class="release-theme" data-mode="light" style="left:48px">${inlinePhotos(tokenMarkup)}</div>`
    + `<div class="release-theme" data-mode="dark" style="left:384px">${inlinePhotos(tokenMarkup)}</div>`
    + `<div class="release-token-ruler" style="left:48px">${d.label(`p-story · ${releaseTheme.inset}`, 'edge')}</div>`
    + `<div class="release-token-ruler" style="left:384px">${d.label(`p-story · ${releaseTheme.inset}`, 'edge')}</div>`
}

function layers(d: Drawing) {
  const rail = `<div class="release-layer-order">${['theme', 'base', 'defaults', 'components', 'utilities'].map((name, index) => `<span data-label data-active="${index > 2}">${name}</span>`).join('')}</div>`
  return d.text(48, 32, 'Cascade order', 'eyebrow')
    + d.text(672, 32, 'Normal declarations →', 'edge', 'end') + rail
    + d.sheet(180, 137, undefined, undefined,
      d.row(d.icon('layers') + d.label('Shared component')) + d.rule
      + d.label('.story-link', 'code') + d.label('padding-inline: 1rem;', 'code'), 'center')
    + d.sheet(540, 137, undefined, undefined,
      d.row(d.icon('layers') + d.label('Local utility')) + d.rule
      + d.label('.px-lg', 'code') + d.label('padding-inline: var(--spacing-lg);', 'code'), 'center')
    + d.route('M180 250V284') + d.route('M540 250V284')
    + d.text(180, 294, 'story-link', 'code', 'center')
    + d.text(540, 294, 'story-link px-lg', 'code', 'center')
    + `<div class="release-links">${componentMarkup.replace(/<a /g, '<a data-label ')}</div>`
    + `<div class="release-padding-guide" style="left:180px">${d.label('1rem each side', 'edge')}</div>`
    + `<div class="release-padding-guide" style="left:540px">${d.label('1.5rem each side', 'edge')}</div>`
    + d.text(360, 439, 'A later layer changes the padding. The component stays shared.', 'note', 'center')
}

function delivery(d: Drawing) {
  return d.text(48, 30, 'Author once. Choose where CSS is generated.', 'eyebrow')
    + '<div class="release-lane-rule" style="top:175px"></div><div class="release-lane-rule" style="top:340px"></div>'
    + d.text(48, 77, '01', 'code') + d.text(86, 74, 'Static', 'title')
    + d.text(86, 99, 'At build time', 'note')
    + d.sheet(245, 67, undefined, undefined, d.row(d.icon('scan') + d.label('Source classes')) + d.label('p-md  fg-brand', 'code'))
    + d.route('M416 104H481')
    + d.mark(493, 80, 'fileCode', 'CSS stylesheet') + d.text(493, 107, 'No Master runtime', 'note')
    + d.text(48, 213, '02', 'code') + d.text(86, 210, 'Progressive', 'title')
    + d.text(86, 235, 'Initial + on demand', 'note')
    + d.sheet(245, 201, undefined, undefined, d.row(d.icon('file') + d.label('Rendered HTML')) + d.label('Initial CSS + manifest', 'edge'))
    + d.route('M428 238H481')
    + d.mark(493, 211, 'window', 'Styled page')
    + d.route('M508 242V281', { dashed: true })
    + d.chip(493, 291, undefined, 'cpu', 'Load engine')
    + d.text(480, 275, 'Uncovered class', 'edge', 'end')
    + d.text(48, 388, '03', 'code') + d.text(86, 385, 'Runtime', 'title')
    + d.text(86, 410, 'In the browser', 'note')
    + d.sheet(245, 375, undefined, undefined, d.row(d.icon('code') + d.label('DOM classes')) + d.label('New classes appear', 'edge'))
    + d.route('M418 412H481')
    + d.mark(493, 388, 'cpu', 'Generate rules') + d.text(493, 415, 'Browser engine', 'note')
}

function tools(d: Drawing) {
  return d.text(48, 30, 'Understand the conflict. Preview the change.', 'eyebrow')
    + d.window(48, 70, 624, 270,
      `<div class="release-editor">
        <div class="release-editor-file">${d.icon('code')}${d.label('journal.html', 'body')}${d.label('Fieldwork / src', 'edge')}</div>
        <div class="release-editor-code">
          <div class="release-code-line"><span class="release-line-number">12</span>${d.label('<article', 'code')}</div>
          <div class="release-code-line"><span class="release-line-number">13</span>${d.label('  class="', 'code')}<span class="code" data-label>p-md <u>p-lg</u></span>${d.label('">', 'code')}</div>
          <div class="release-code-line"><span class="release-line-number">14</span>${d.label('  Field notes', 'code')}</div>
          <div class="release-code-line"><span class="release-line-number">15</span>${d.label('</article>', 'code')}</div>
        </div>
        <div class="release-diagnostic"><span class="release-diagnostic-heading">${d.label('p-lg is overridden by p-md', 'body')}<span class="release-diagnostic-count">1 conflict</span></span>${d.label('@master/css/no-conflicting-classes', 'edge')}</div>
      </div>`)
    + d.sheet(360, 366, undefined, undefined,
      d.row(d.icon('check') + d.label('Fix preview') + '<span class="release-file-note">Remove the overridden class</span>')
      + d.label('<article class="p-md">Field notes</article>', 'code'), 'center')
    + d.text(360, 449, 'Editor · ESLint · MCP — one project vocabulary', 'note', 'center')
}

const renderers = { fieldwork, anatomy, tokens, layers, delivery, tools }

/** Each scene is a different visual argument. The generated CSS is real preset/compiler output. */
export function renderRelease(name: ReleaseFigureName, theme: Theme) {
  const figure = releaseFigures[name]
  const d = drawing(theme)
  const result = d.scene(figure.title, figure.description.join(' '), renderers[name](d))
  const css = name === 'fieldwork'
    ? configuredExampleCSS(fieldworkSource, configuredMarkupClasses(fieldworkMarkup))
    : name === 'tokens' ? configuredExampleCSS(themeSource, configuredMarkupClasses(tokenMarkup))
    : name === 'layers' ? configuredExampleCSS(componentSource, configuredMarkupClasses(componentMarkup)) : ''
  const style = new URL('./illustration.css', import.meta.url).href
  return { ...result, html: result.html.replace('</head>', `<link rel="stylesheet" href="${style}"><style>@layer theme, base, defaults, components, utilities;${css}</style></head>`) }
}

/** Social artwork reuses the actual journal specimen, with a separate 1200 × 630 composition. */
export function socialHTML() {
  const result = renderRelease('fieldwork', 'dark')
  return result.html.replace('width:720px;height:480px', 'width:1200px;height:630px')
    .replace('<main class="scene"', '<main class="scene release-social"')
    .replace('<div class="release-board">', `<div class="release-social-title"><span data-label>Introducing</span><h1 data-label>Master CSS<br>2.0</h1><p data-label>From your first idea<br>to a design system of your own.</p></div><div class="release-board">`)
}
