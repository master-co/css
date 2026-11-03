import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'keyframe-reachability',
  render(theme: Theme) {
    const { text, label, at, codeScope, route, finish } = study('keyframe-reachability', theme)
    route('M360 170V232')
    return finish(`
      ${text(360, 63, 'File policy: @prune native', 'eyebrow', 'center')}
      ${text(360, 125, '@safelist keyframes "reveal";', 'code', 'center')}
      ${text(375, 185, 'Retains the named resource', 'edge')}
      ${at(360, 248, codeScope('@keyframes reveal {', codeScope('to {', label('opacity: 1;', 'code'))), 'centered')}
      ${text(360, 397, 'A definition is available; no animation has been started', 'title', 'center')}
      ${text(360, 432, 'No class rule or animation declaration is created by the safelist', 'edge', 'center')}
    `)
  }
}
