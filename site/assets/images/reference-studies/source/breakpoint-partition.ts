import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'breakpoint-partition',
  render(theme: Theme) {
    const { text, finish } = study('breakpoint-partition', theme)
    return finish(`
      ${text(360, 76, 'The same boundary, opposite membership', 'eyebrow', 'center')}
      ${text(96, 152, '@max-md', 'code')}
      ${text(622, 266, '@md', 'code', 'end')}
      <svg style="left:96px;top:180px" width="528" height="146" viewBox="0 0 528 146">
        <path class="axis" d="M0 20H528M0 122H528M264 0V146"/>
        <path class="interval" d="M0 20H264"/><circle class="endpoint-open" cx="264" cy="20" r="5"/>
        <path class="interval secondary" d="M264 122H528"/><circle class="endpoint-filled" cx="264" cy="122" r="5"/>
      </svg>
      ${text(360, 228, '64rem', 'code', 'center')}
      ${text(96, 354, 'Below 64rem', 'note')}
      ${text(624, 354, '64rem and above', 'note', 'end')}
      ${text(360, 420, 'Open dot: excluded · filled dot: included', 'edge', 'center')}
    `)
  }
}
