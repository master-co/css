import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'static-branch-extraction',
  render(theme: Theme) {
    const { text, label, at, route, finish } = study('static-branch-extraction', theme)
    route('M280 146V184H202V219')
    route('M470 146V184H518V219')
    return finish(`
      ${text(360, 65, 'Complete source alternatives', 'eyebrow', 'center')}
      ${text(360, 113, 'error ? "bg-red-60" : "bg-green-60"', 'code', 'center')}
      ${at(202, 230, `<div class="branch-label">${label('bg-red-60', 'code')}</div>`, 'centered')}
      ${at(518, 230, `<div class="branch-label">${label('bg-green-60', 'code')}</div>`, 'centered')}
      ${text(360, 280, 'Both are discoverable', 'note', 'center')}
      ${text(202, 366, '"bg-" + tone', 'code', 'center')}
      ${text(518, 366, 'No completed class to extract', 'note', 'center')}
      ${text(360, 425, 'The scanner does not execute the expression', 'edge', 'center')}
    `)
  }
}
