import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'has-owner-target',
  render(theme: Theme) {
    const { text, label, at, finish } = study('has-owner-target', theme)
    const classes = 'b(2) b-solid b-line-divider b-blue-60:has(>input:checked)'
    return finish(`
      <style>${generatePresetCSS(classes.split(' '))}</style>
      ${text(360, 72, 'The child supplies the state · the parent receives the style', 'eyebrow', 'center')}
      ${text(360, 122, 'b-blue-60:has(>input:checked)', 'code', 'center')}
      ${text(208, 184, 'No checked direct child', 'note', 'center')}
      ${text(512, 184, 'Checked direct child', 'note', 'center')}
      ${[false, true].map((checked, i) => at(96 + i * 304, 236, `<label class="detail-choice ${classes}"><input type="checkbox" ${checked ? 'checked' : ''}>${label('Send updates', 'body')}</label>`)).join('')}
      <svg class="routes" width="720" height="480" style="pointer-events:none"><path d="M430 340V280" marker-end="url(#arrow)"/><path d="M610 340H644V268H626" marker-end="url(#arrow)"/></svg>
      ${text(430, 354, 'Test here', 'edge', 'center')}
      ${text(610, 354, 'Style here', 'edge', 'center')}
      ${text(360, 414, 'Both labels already have b(2), b-solid and b-line-divider', 'edge', 'center')}
    `)
  }
}
