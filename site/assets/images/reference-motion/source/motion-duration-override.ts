import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// A shared linear time axis isolates duration; it does not depict easing or rendering speed.
export default {
  id: 'motion-duration-override',
  render(theme: Theme) {
    const { text, scene } = drawing(theme)
    const figure = referenceIllustrations['motion-duration-override']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>
        .duration-bar { height: 12px; border-radius: var(--ui-radius-xs); background: color-mix(in oklch, var(--annotation-ink) 14%, transparent); border-inline-end: 2px solid var(--annotation-ink); }
        .duration-guide { width: 0; height: 178px; border-left: 1px dashed var(--ui-line-divider); }
        .duration-axis { width: 480px; border-top: 1px solid var(--ui-line-mark); }
        .duration-tick { height: 6px; border-left: 1px solid var(--ui-line-mark); }
      </style>
      ${text(120, 72, l.first, 'code')}
      ${text(120, 104, l.firstResult, 'note')}
      <div class="duration-bar" data-tone="blue" style="left:120px;top:148px;width:480px"></div>
      ${text(120, 234, l.second, 'code')}
      ${text(120, 266, l.secondResult, 'note')}
      <div class="duration-bar" data-tone="violet" style="left:120px;top:310px;width:144px"></div>
      <div class="duration-guide" style="left:600px;top:160px"></div>
      <div class="duration-axis" style="left:120px;top:350px"></div>
      ${[120, 264, 600].map(x => `<div class="duration-tick" style="left:${x}px;top:350px"></div>`).join('')}
      ${text(120, 366, l.start, 'edge', 'center')}
      ${text(264, 366, l.middle, 'edge', 'center')}
      ${text(600, 366, l.end, 'edge', 'center')}
      ${text(360, 432, l.scope, 'edge', 'center')}
    `)
  }
}
