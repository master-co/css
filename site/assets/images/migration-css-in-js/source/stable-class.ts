import { cssInJSIllustration as figure } from '../../../../content/guide/migration/css-in-js/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Matched 240px tracks make the percentage change measurable; only the fill changes.
export default {
  id: 'stable-class',
  render(theme: Theme) {
    const { scene, sheet, row, icon, label, text, route } = drawing(theme)
    const l = figure.labels
    const meter = (x: number, value: number, code: string, amount: string) => `
      <div class="meter-instance" style="left:${x}px;--value:${value}%">
        ${label(code, 'code')}
        <div class="meter-track"><i></i></div>
        ${label(amount, 'note')}
      </div>`
    return scene(figure.title, figure.alt, `
      <style>
        .meter-instance { top:272px;translate:-50% 0;display:flex;flex-direction:column;gap:20px;align-items:center;width:max-content; }
        .meter-track { width:240px;height:8px;border-radius:999px;overflow:hidden;background:var(--ui-surface-well);box-shadow:inset 0 0 0 1px var(--ui-line-divider); }
        .meter-track i { display:block;width:var(--value);height:100%;background:var(--ui-text-muted); }
      </style>
      ${text(360, 64, l.shared, 'note', 'center')}
      ${sheet(360, 112, undefined, undefined, row(icon('code') + label(l.class, 'code')), 'center')}
      ${route('M360 180V218H200V250')}${route('M360 218H520V250')}
      ${meter(200, 25, l.first, l.firstValue)}${meter(520, 75, l.second, l.secondValue)}
      ${text(360, 404, l.local, 'note', 'center')}
    `)
  }
}
