import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'where-specificity',
  render(theme: Theme) {
    const { text, label, at, finish } = study('where-specificity', theme)
    const cell = (value: string, kind: 'code' | 'note' | 'title' = 'code') => `<div>${label(value, kind)}</div>`
    return finish(`
      ${text(360, 66, 'Same owner · different suffix contribution', 'eyebrow', 'center')}
      ${text(360, 116, 'underline:where(:hover,#selected)', 'code', 'center')}
      ${text(360, 144, 'underline:is(:hover,#selected)', 'code', 'center')}
      ${at(84, 212, `<div class="detail-table" style="grid-template-columns:204px 90px 90px 90px">
        ${cell('Generated suffix', 'note')}${cell('Owner', 'note')}${cell('Suffix', 'note')}${cell('Total', 'title')}
        ${cell(':where(:hover,#selected)')}${cell('0-1-0')}${cell('0-0-0')}${cell('0-1-0')}
        ${cell(':is(:hover,#selected)')}${cell('0-1-0')}${cell('1-0-0')}${cell('1-1-0')}
      </div>`)}
      ${text(360, 420, 'is() uses the most specific argument, even when :hover matches', 'edge', 'center')}
    `)
  }
}
