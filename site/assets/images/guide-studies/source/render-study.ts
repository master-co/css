import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'
import { guideStudies, type GuideStudyId } from '../../../../content/guide/studies'

/** Local compositions for the Guide expansion. Equal widths denote a controlled
 * comparison or an actual boundary; sheets and text otherwise size to content.
 * The registry supplies the same lesson to each image, its description and exports. */
export function renderStudy(id: GuideStudyId, theme: Theme) {
  const figure = guideStudies[id]
  const l: readonly string[] = figure.labels
  const { scene, label } = drawing(theme)
  const t = (value: string, kind: 'code' | 'title' | 'note' | 'eyebrow' = 'code') => label(value, kind)
  const block = (title: string, body: string, tone = '') => `<section class="study-artifact" data-tone="${tone}">${t(title, 'title')}${body}</section>`
  const note = (value: string) => `<div class="study-note">${t(value, 'note')}</div>`
  const arrow = '<svg class="study-arrow" viewBox="0 0 48 20" aria-hidden="true"><path d="M2 10H44M38 5l6 5-6 5"/></svg>'
  const branches = (source: string, a: string, ar: string, b: string, br: string) => `<div class="study-branch">${block(source, '')}<div class="study-split" aria-hidden="true"></div><div class="study-columns">${block(a, t(ar), 'blue')}${block(b, t(br), 'violet')}</div></div>`
  let body = ''
  switch (figure.kind) {
    case 'pairs':
      body = `<div class="study-pairs">${[0, 3].map(i => `<div class="study-pair">${t(l[i], 'eyebrow')}<div class="study-code-input">${t(l[i + 1])}</div>${arrow}${t(l[i + 2])}</div>`).join('')}</div>`
      if (id === 'palette-or-role') body = `<div class="study-palette">${t(l[0], 'eyebrow')}<div class="palette-row">${t(l[1])}<i class="fixed-paint bg-blue-60"></i>${t('Fixed blue-60', 'note')}</div>${t(l[3], 'eyebrow')}<div class="palette-row">${t(l[4])}<i class="role-paint scheme-light bg-surface-base"></i><i class="role-paint scheme-dark bg-surface-base"></i></div>${note('Light scheme / dark scheme')}</div>`
      break
    case 'matrix':
      body = `${note(l[6])}<div class="study-matrix">${t(l[3], 'eyebrow')}<span></span>${t(l[4], 'title')}${t(l[5], 'title')}${t(l[0], 'eyebrow')}${t(l[1])}<span class="matrix-cell">${t(id === 'conditions-intersection' ? '—' : 'On demand', 'note')}</span><span class="matrix-cell">${t(id === 'conditions-intersection' ? '—' : 'Substitute', 'note')}</span><span></span>${t(l[2])}<span class="matrix-cell">${t(id === 'conditions-intersection' ? '—' : 'Retain', 'note')}</span><span class="matrix-cell selected">${t(id === 'conditions-intersection' ? 'display: grid' : 'Both', 'code')}</span></div>`
      break
    case 'scope':
      body = `<div class="study-scope">${t(l[0], 'eyebrow')}${t(l[1])}<div class="study-value blue">${t(l[2])}</div><div class="study-scope child">${t(l[3], 'eyebrow')}${t(l[4])}<div class="study-value blue">${t(l[5])}</div><div class="study-value violet">${t(l[6])}</div></div></div>`
      break
    case 'fork':
      if (id === 'language-and-delivery') body = `${block(l[0], t(l[1]))}<div class="study-split"></div><div class="study-columns">${block(l[2], t(l[3]), 'blue')}${block(l[4], t(l[5]), 'violet')}</div>`
      else body = `<div class="study-columns">${block(l[0], t(l[1]), 'blue')}${block(l[2], t(l[3]), 'violet')}</div><div class="study-split reverse"></div>${block(l[4], t(l[5], 'note'))}`
      break
    case 'scheme':
      body = `<div class="study-scope">${t(l[0], 'eyebrow')}<div class="study-scheme light">${t(l[1])}</div><div class="study-scope child">${t(l[2], 'eyebrow')}<div class="study-scheme dark">${t(l[3])}</div></div></div>${note(l[4])}`
      break
    case 'width':
      body = `<div class="study-widths">${[240, 480].map((w, i) => `<section style="width:${w}px">${t(l[i], 'eyebrow')}<div class="study-parent"><div class="study-capped">${t(l[2])}</div></div>${note(l[i + 3])}</section>`).join('')}</div>`
      break
    case 'content':
      body = `${note(l[0])}<div class="study-columns content-columns">${[false, true].map(long => `<section><div class="study-prose">${t(id === 'type-content-height' ? l[long ? 2 : 1] : l[long ? 4 : 2], 'title')}</div>${note(id === 'type-content-height' ? l[3] : l[long ? 3 : 1])}</section>`).join('')}</div>${note(l[l.length - 1])}`
      break
    case 'nested':
      body = `<div class="study-scope outer-named">${t(l[0], 'eyebrow')}<div class="study-scope child nearer">${t(l[1], 'eyebrow')}${block(l[2], `<span class="named-query">${t(l[3])}</span>`)}</div><div>${t(l[4], 'note')}</div></div>`
      break
    case 'layout':
      body = `<div class="study-columns layout-columns">${[false, true].map(row => `<section>${t(l[row ? 1 : 0], 'eyebrow')}<div class="study-card ${row ? 'is-row' : ''}">${t(l[2], 'title')}<span class="study-control">${t(l[3])}</span></div></section>`).join('')}</div>${note(l[4])}${note(l[5])}`
      break
    case 'stack':
      body = `<div class="study-stack">${t(l[3], 'eyebrow')}<div class="study-winner">${t(l[2])}${t(l[4], 'note')}</div><div class="study-layer">${t(l[1])}</div><div class="study-layer">${t(l[0])}</div></div>`
      break
    case 'tree':
      body = `${block(l[0], t(l[1]))}<div class="study-split"></div><div class="study-scope">${id === 'delivery-not-scope' ? t(l[2], 'eyebrow') : ''}<div class="study-columns">${id === 'delivery-not-scope' ? block(l[3], '', 'blue') + block(l[4], '', 'blue') : block(l[2], t(l[3]), 'blue') + block(l[4], t(l[5]), 'violet')}</div></div>${id === 'delivery-not-scope' ? note(l[5]) : ''}`
      break
    case 'font':
      body = `${note(l[0])}<div class="study-font">${[32, 48].map((size, i) => `<section>${t(l[i + 1])}<div style="font-size:${size}px" class="study-heading" data-label>${l[3]}</div></section>`).join('')}</div>${note(l[4])}`
      break
    case 'flow':
      body = `<div class="study-flow">${block(l[0], t(l[1]))}${arrow}${block(l[2], `<span class="named-query">${t(l[3])}</span>`)}${arrow}${block(l[4], '')}</div>${note(l[5])}`
      if (id === 'installation-observation') body = `<div class="study-flow">${block(l[0], t(l[1]))}${arrow}${block(l[2], t(l[3]))}</div><div class="study-columns install-result">${[16,24].map((padding,i) => `<section>${t(i ? 'p-lg' : 'p-md')}<div class="study-padding" style="padding:${padding}px"><span data-label>Hello</span></div></section>`).join('')}</div>${note(l[4])}`
      break
    case 'branch':
      body = branches(l[0], l[1], l[2], l[3], l[4]) + note(l[5])
      break
    case 'migration':
      body = `<div class="study-columns">${[false, true].map(after => `<section class="study-migration">${t(l[after ? 1 : 0], 'eyebrow')}${l.slice(2, 5).map((v, i) => `<div class="study-region ${i === 1 ? after ? 'changed' : 'target' : ''}">${t(v, 'title')}</div>`).join('')}</section>`).join('')}</div>${note(l[5])}`
      break
    case 'parameters':
      body = `<div class="study-columns padding-columns">${[40,48].map((h,i) => `<section>${t(l[i])}${t(l[i+2], 'note')}<div class="study-padding parameter-control" style="min-height:${h}px;padding-inline:${h/2}px"><span data-label>${l[5]}</span></div></section>`).join('')}</div>${note(l[4])}`
      break
    case 'padding':
      body = `<div class="study-columns padding-columns">${[16, 24].map((px, i) => `<section>${t(l[i], 'eyebrow')}${t(l[2])}<div class="study-padding" style="padding-inline:${px}px"><span data-label>${l[3]}</span></div></section>`).join('')}</div>${note(l[4])}`
      break
    case 'coverage':
      body = `<div class="study-scope">${t(l[0], 'eyebrow')}<div class="study-coverage"><div class="study-checked">${t(l[1], 'eyebrow')}${block(l[2], '')}${block(l[3], '')}</div><div>${block(l[4], '')}${note(l[5])}</div></div></div>`
      break

  }
  return scene(figure.title, figure.alt, `<style>${id === 'palette-or-role' ? generatePresetCSS(['bg-blue-60','bg-surface-base']) : ''}
    .study { position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:24px;padding:38px; }
    .study * { box-sizing:border-box; }
    .study-artifact { display:flex;flex-direction:column;gap:12px;padding:16px 20px;border-radius:var(--ui-radius-xl);background:var(--ui-surface-sheet);box-shadow:var(--ui-elevation-rise-1);max-width:280px; }
    .study-artifact[data-tone=blue] { border-top:2px solid var(--ui-tone-blue); }
    .study-artifact[data-tone=violet] { border-top:2px solid var(--ui-tone-violet); }
    .study-columns { display:flex;gap:36px;align-items:flex-start;justify-content:center; }
    .study-columns > section { display:flex;flex-direction:column;gap:14px; }
    .study-note { text-align:center; }
    .study-note .note { white-space:normal; }
    .study-arrow { flex:none;width:38px;height:20px;align-self:center;stroke:var(--ui-text-disabled);fill:none;stroke-width:1; }
    .study-code-input { padding:14px 16px;border-radius:var(--ui-radius-md);background:var(--ui-surface-code);border:1px solid var(--ui-line-contour);justify-self:start; }
    .study-palette { display:flex;flex-direction:column;gap:24px; }
    .palette-row { display:flex;align-items:center;gap:24px;margin-bottom:24px; }
    .palette-row > .code { width:150px; }
    .palette-row i { width:64px;height:64px;border:1px solid var(--ui-line-contour);border-radius:var(--ui-radius-md); }
    .fixed-paint { background:var(--color-blue-60); }
    .role-paint { background:var(--color-surface-base); }
    .role-paint.scheme-light { color-scheme:light; } .role-paint.scheme-dark { color-scheme:dark; }
    .study-padding.parameter-control { display:flex;align-items:center;padding-block:0; }
    .study-pairs { display:grid;gap:64px; }
    .study-pair { display:grid;grid-template-columns:minmax(190px,max-content) 38px minmax(190px,max-content);gap:18px;align-items:center; }
    .study-pair > .eyebrow { grid-column:1/-1; }
    .study-pair .study-artifact { justify-self:start; }
    .study-matrix { display:grid;grid-template-columns:max-content max-content 120px 130px;align-items:center;gap:20px 18px; }
    .study-matrix > .eyebrow:first-child { grid-column:3/-1;justify-self:center; }
    .study-matrix > span:nth-child(2) { grid-column:1/3; }
    .matrix-cell { padding:20px 10px;border-bottom:1px solid var(--ui-line-contour);text-align:center; }
    .matrix-cell.selected { border:1px solid var(--ui-tone-blue);border-radius:var(--ui-radius-md);background:color-mix(in oklch,var(--ui-tone-blue) 7%,transparent); }
    .study-scope { display:flex;flex-direction:column;gap:16px;padding:22px;border:1px solid var(--ui-line-contour);border-radius:var(--ui-radius-lg); }
    .study-scope.child { margin-top:8px;border-color:var(--ui-tone-violet); }
    .study-value { padding-left:12px;border-left:2px solid; }
    .study-value.blue { border-color:var(--ui-tone-blue); }
    .study-value.violet { border-color:var(--ui-tone-violet); }
    .study-split { position:relative;width:240px;height:36px;border:solid var(--ui-line-mark);border-width:1px 1px 0;margin-top:18px;flex:none; }
    .study-split::before { content:'';position:absolute;height:18px;bottom:100%;left:50%;border-left:1px solid var(--ui-line-mark); }
    .study-split.reverse { rotate:180deg;margin:0 0 18px; }
    .study-branch { display:flex;flex-direction:column;align-items:center;gap:0; }
    .study-branch > .study-artifact { margin-bottom:0; }
    .study-branch > .study-columns { margin-top:10px; }
    .study-scheme { padding:22px 36px;border:1px solid var(--ui-line-contour);border-radius:var(--ui-radius-md);background:light-dark(var(--ui-surface-sheet),var(--ui-surface-well));color:var(--ui-text-strong); }
    .study-scheme.light { color-scheme:light; } .study-scheme.dark { color-scheme:dark; }
    .study-widths { display:flex;flex-direction:column;align-items:center;gap:40px; }
    .study-widths section { display:flex;flex-direction:column;gap:14px; }
    .study-parent { padding-block:14px;border-inline:1px dashed var(--ui-tone-blue);background:color-mix(in oklch,var(--ui-tone-blue) 5%,transparent); }
    .study-capped { width:100%;max-width:384px;margin:auto;padding:18px 12px;text-align:center;border-radius:var(--ui-radius-md);background:var(--ui-surface-sheet);box-shadow:var(--ui-elevation-rise-1); }
    .content-columns { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:456px; }
    .content-columns > section { min-width:0;overflow-wrap:anywhere; }
    .study-prose { padding:22px;background:var(--ui-surface-sheet);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-elevation-rise-1); }
    .study-prose .title { display:block;font-size:var(--ui-text-h3);line-height:1.5;white-space:normal; }
    .study-scope.outer-named { border-color:var(--ui-tone-blue);padding-left:50px;position:relative; }
    .nearer { margin-left:25px; }
    .named-query { color:var(--ui-tone-blue);border-left:2px solid var(--ui-tone-blue);padding-left:10px; }
    .study-scope.outer-named > .eyebrow { color:var(--ui-tone-blue); }
    .study-card { display:flex;flex-direction:column;gap:20px;padding:24px;border-radius:var(--ui-radius-lg);background:var(--ui-surface-sheet);box-shadow:var(--ui-elevation-rise-1);align-items:flex-start; }
    .study-card.is-row { flex-direction:row;align-items:center; }
    .study-control { padding:8px 12px;border:1px solid var(--ui-line-contour);border-radius:var(--ui-radius-md); }
    .study-stack { display:flex;flex-direction:column;gap:12px; }
    .study-layer,.study-winner { padding:16px 22px;border:1px solid var(--ui-line-contour);border-radius:var(--ui-radius-md); }
    .study-winner { margin:20px 0 24px;border-color:var(--ui-tone-blue);display:flex;gap:30px;align-items:center; }
    .study-font { display:flex;flex-direction:column;gap:28px; }
    .study-font section { display:flex;flex-direction:column;gap:12px; }
    .study-heading { line-height:1.3;font-weight:var(--ui-weight-regular); }
    .study-flow { display:flex;gap:14px;align-items:center; }
    .study-flow .study-artifact { max-width:170px; }
    .study-flow .title { white-space:normal; }
    .study-region { padding:18px 48px;border:1px solid var(--ui-line-contour);border-radius:var(--ui-radius-md); }
    .study-region.target { border-style:dashed;border-color:var(--ui-tone-blue); }
    .study-region.changed { border-color:var(--ui-tone-blue);background:color-mix(in oklch,var(--ui-tone-blue) 8%,var(--ui-surface-sheet)); }
    .study-padding { align-self:center;padding-block:12px;background:color-mix(in oklch,var(--ui-tone-blue) 9%,var(--ui-surface-sheet));border:1px solid var(--ui-line-contour);border-radius:var(--ui-radius-md); }
    .study-padding > span { display:block;outline:1px dotted var(--ui-tone-blue);background:var(--ui-surface-sheet); }
    .padding-columns > section { align-items:center;gap:24px; }
    .study-coverage { display:flex;gap:28px;align-items:center; }
    .study-checked { display:flex;flex-direction:column;gap:18px;padding:20px;border-left:2px solid var(--ui-tone-blue);background:color-mix(in oklch,var(--ui-tone-blue) 5%,transparent); }
  </style><div class="study">${body}</div>`)
}
