import { bootstrapIllustration as figure } from '../../../../content/guide/migration/bootstrap/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// A shared numeric axis compares activation thresholds; track widths are the measured variable.
export default {
  id: 'breakpoint-values',
  render(theme: Theme) {
    const { scene, text, sheet, label } = drawing(theme)
    const l = figure.labels
    const track = (y: number, offset: number, name: string, tone: string) => `
      ${text(42, y - 6, name, 'code')}
      <div class="threshold-track" style="top:${y}px;--offset:${offset}px;--tone:var(${tone})"><i></i></div>`
    return scene(figure.title, figure.alt, `
      <style>
        .threshold-track { left:230px;width:432px;height:12px;border-radius:2px;background:var(--ui-surface-well);box-shadow:inset 0 0 0 1px var(--ui-line-divider); }
        .threshold-track i { display:block;margin-left:var(--offset);width:calc(100% - var(--offset));height:100%;background:color-mix(in oklch,var(--tone) 34%,transparent);border-left:2px solid var(--tone); }
      </style>
      ${text(360, 48, l.same, 'note', 'center')}
      ${text(230, 98, l.start, 'edge')}${text(338, 98, l.bootstrap, 'edge', 'center')}${text(554, 98, l.master, 'edge', 'center')}${text(662, 98, l.end, 'edge', 'end')}
      ${track(153, 108, l.original, '--ui-tone-blue')}
      ${track(223, 324, l.preset, '--ui-text-muted')}
      ${track(293, 108, l.kept, '--ui-tone-blue')}
      ${sheet(360, 366, undefined, undefined, label(l.condition, 'code'), 'center')}
      ${text(360, 438, l.difference, 'note', 'center')}
    `)
  }
}
