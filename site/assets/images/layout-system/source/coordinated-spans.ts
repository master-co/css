import { layoutIllustration as figure } from '../../../../content/guide/layout-system/illustration'
import { configuredExampleCSS } from '../../../../reference/configured-example'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// A measured grid anatomy, not a miniature viewport: eight real equal tracks and exact span relationships.
export default {
  id: 'coordinated-spans',
  render(theme: Theme) {
    const { scene, label, text } = drawing(theme)
    const l = figure.labels
    const css = configuredExampleCSS('', ['grid-cols(8)', 'gap-md', ...[3,4,5,8].map(n => `grid-col-span(${n})`)])
    const cell = (span: number, name: string) => `<div class="layout-cell grid-col-span(${span})">${label(name, 'body')}</div>`
    return scene(figure.title, figure.alt, `
      <style>${css}
        .layout-grid { left:80px;top:124px;width:560px; }
        .layout-track { display:flex;justify-content:center;padding:8px 0;border-inline:1px dotted var(--ui-line-divider);background:var(--ui-surface-tray); }
        .layout-cell { padding:20px 16px;border-radius:var(--ui-radius-lg);background:var(--ui-surface-sheet);box-shadow:var(--ui-elevation-rise-1); }
      </style>
      ${text(360, 65, l.grid, 'code', 'center')}
      <div class="layout-grid grid-cols(8) gap-md">
        ${Array.from({ length: 8 }, (_, i) => `<div class="layout-track">${label(String(i + 1), 'note')}</div>`).join('')}
        ${cell(8, l.header)}${cell(4, l.revenue)}${cell(4, l.activation)}${cell(5, l.demand)}${cell(3, l.tasks)}
      </div>
      ${text(360, 417, l.footer, 'note', 'center')}
    `)
  }
}
