import { globalIllustration as figure } from '../../../../content/guide/global-styles/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// A file graph, not a runtime sequence. One entry collects three distinct source owners.
export default {
  id: 'entry-graph',
  render(theme: Theme) {
    const { scene, sheet, label, row, icon, rule, mark, text, route } = drawing(theme)
    const l = figure.labels
    const file = (y: number, name: string, code: string, purpose: string) => `
      <div class="global-file" style="top:${y}px">
        <div class="row">${icon('fileCode')}${label(name)}</div>
        ${label(code, 'code')}${label(purpose, 'note')}
      </div>`
    return scene(figure.title, figure.alt, `
      <style>
        .global-file { left:430px;display:flex;flex-direction:column;gap:8px;width:max-content; }
        .global-file > .row { display:flex;align-items:center;gap:8px; }
      </style>
      ${mark(184, 95, 'window', l.root, 'center')}
      ${route('M184 125V158')}
      ${sheet(184, 180, undefined, undefined, `
        ${row(icon('fileCode') + label(l.entry))}${rule}
        ${label("@import '@master/css';", 'code')}
        ${label("@import './theme.css';", 'code')}
        ${label("@import './defaults.css';", 'code')}
        ${label("@import './components.css';", 'code')}
      `, 'center')}
      ${route('M307 263H375', { arrow: false })}
      ${route('M375 99V355', { arrow: false })}
      ${route('M375 99H409')}${route('M375 227H409')}${route('M375 355H409')}
      ${file(88, l.theme, l.themeBody, l.definitions)}
      ${file(216, l.defaults, l.defaultsBody, l.native)}
      ${file(344, l.components, l.componentsBody, l.roles)}
      ${text(184, 388, l.shared, 'note', 'center')}
    `)
  }
}
