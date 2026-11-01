import { cssMigrationIllustration as figure } from '../../../../content/guide/migration/css/illustration'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Two authoring paths converge on one result. No redesign is implied by moving declarations.
export default {
  id: 'equivalent-card',
  render(theme: Theme) {
    const { scene, sheet, row, icon, rule, label, text, route } = drawing(theme)
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>
        .migration-card { left:360px;top:326px;translate:-50% 0;display:grid;gap:16px;padding:24px;border-radius:8px;background:var(--ui-surface-sheet);box-shadow:var(--ui-elevation-rise-1);width:max-content; }
      </style>
      ${sheet(180, 68, undefined, undefined, row(icon('fileCode') + label(l.css)) + rule + label(l.gap, 'code') + label(l.padding, 'code') + label(l.radius, 'code'), 'center')}
      ${sheet(533, 68, undefined, undefined, row(icon('code') + label(l.markup)) + rule + label(l.classes, 'code') + label(l.roles, 'code'), 'center')}
      ${route('M180 223V258H360', { arrow: false })}${route('M533 199V258H360', { arrow: false })}
      ${route('M360 258V307')}
      ${text(378, 279, l.result, 'note')}
      <div class="migration-card">${label(l.title, 'title')}${label(l.body, 'body')}</div>
    `)
  }
}
