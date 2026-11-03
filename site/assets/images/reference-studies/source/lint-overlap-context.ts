import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'lint-overlap-context',
  render(theme: Theme) {
    const { text, label, at, lines, finish } = study('lint-overlap-context', theme)
    return finish(`
      ${text(360, 62, 'Compare properties inside the same variant scope', 'eyebrow', 'center')}
      ${text(204, 134, 'Same scope', 'title', 'center')}
      ${text(516, 134, 'Separate query scopes', 'title', 'center')}
      ${at(92, 198, `<div class="detail-boundary" style="width:224px">${label('No suffix', 'note')}<div style="margin-top:16px">${lines(['(margin:.625rem)', '(margin:1.25rem)'])}</div></div>`)}
      ${at(392, 198, `<div style="display:flex;gap:16px">
        <div class="detail-boundary" style="padding:20px 16px">${label('@sm', 'code')}<div style="margin-top:16px">${lines(['margin:', '2.5rem'])}</div></div>
        <div class="detail-boundary" style="padding:20px 16px">${label('@md', 'code')}<div style="margin-top:16px">${lines(['margin:', '3.125rem'])}</div></div>
      </div>`)}
      ${text(204, 352, 'Same-scope conflict', 'note', 'center')}
      ${text(516, 352, 'Not that diagnostic', 'note', 'center')}
      ${text(360, 428, 'The sm and md browser ranges can still overlap', 'edge', 'center')}
    `)
  }
}
