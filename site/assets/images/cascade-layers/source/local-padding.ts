import { cascadeIllustration as figure } from '../../../../content/guide/cascade-layers/illustration'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Priority is vertical order, not card depth. The result measures real 12px padding at a 16px root.
export default {
  id: 'local-padding',
  render(theme: Theme) {
    const { scene, label, text, route } = drawing(theme)
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>
        .layer-stack { left:82px;top:112px;display:flex;flex-direction:column;gap:0;width:max-content; }
        .layer-row { display:grid;grid-template-columns:100px max-content;gap:16px;padding:13px 14px;border-bottom:1px solid var(--ui-line-hair); }
        .layer-row[data-wins] { background:color-mix(in oklch,var(--ui-tone-blue) 7%,transparent);border-bottom-color:var(--ui-tone-blue); }
        .layer-row[data-wins] .code { color:var(--ui-text-strong); }
        .layer-result { left:546px;top:230px;translate:-50% 0;display:flex;flex-direction:column;align-items:center;gap:24px; }
        .layer-sample { position:relative;padding:12px;border-radius:var(--ui-radius-lg);background:color-mix(in oklch,var(--ui-tone-blue) 10%,var(--ui-surface-sheet));box-shadow:var(--ui-elevation-rise-1); }
        .layer-sample .body { display:block;background:var(--ui-surface-sheet);outline:1px dotted var(--ui-tone-blue); }
      </style>
      ${text(360, 53, l.scope, 'note', 'center')}
      <div class="layer-stack">
        ${[l.theme, l.base, l.defaults].map(name => `<div class="layer-row">${label(name, 'code')}<span></span></div>`).join('')}
        <div class="layer-row">${label(l.components, 'code')}${label(l.component, 'code')}</div>
        <div class="layer-row" data-wins>${label(l.utilities, 'code')}${label(l.utility, 'code')}</div>
      </div>
      ${route('M58 126V343')}
      ${text(82, 383, l.order, 'note')}
      ${route('M362 325H447V292H474')}
      <div class="layer-result">
        ${label(l.element, 'code')}
        <div class="layer-sample">${label(l.sample, 'body')}</div>
        ${label(l.result, 'note')}
      </div>
    `)
  }
}
