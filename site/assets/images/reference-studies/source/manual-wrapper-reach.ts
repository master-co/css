import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'manual-wrapper-reach',
  render(theme: Theme) {
    const { text, label, at, finish } = study('manual-wrapper-reach', theme)
    return finish(`
      <style>
        .detail-theme-region { background:var(--ui-surface-sheet); color:var(--ui-text-body); }
        .detail-theme-region[data-theme="dark"] { color-scheme:dark; }
        .detail-theme-region[data-theme="light"] { color-scheme:light; }
        .detail-chart:where([data-theme="dark"], [data-theme="dark"] *) { opacity:.85; }
      </style>
      ${text(360, 58, 'Ancestry and color scheme answer different questions', 'eyebrow', 'center')}
      ${at(92, 124, `<div class="detail-boundary detail-theme-region" data-theme="dark" style="width:340px">
        ${label('data-theme="dark"', 'code')}
        <div class="detail-boundary detail-theme-region" data-theme="light">${label('data-theme="light"', 'code')}
          <div class="detail-chart"><i style="height:32px"></i><i style="height:52px"></i><i style="height:42px"></i></div>
          <div style="margin-top:12px">${label('.chart', 'code')}</div>
        </div></div>`)}
      <svg class="routes" width="720" height="480"><path d="M434 152H454V300H410" data-dashed marker-end="url(#arrow)"/></svg>
      ${text(480, 230, 'Still a dark descendant', 'note')}
      ${text(480, 258, 'Wrapper matches', 'title')}
      ${text(480, 304, 'Local scheme: light', 'note')}
      ${text(360, 414, ':where([data-theme="dark"], [data-theme="dark"] *)', 'code', 'center')}
    `)
  }
}
