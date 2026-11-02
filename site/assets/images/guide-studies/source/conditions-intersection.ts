import { renderStudy } from './render-study'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'conditions-intersection',
  render: (theme: Theme) => renderStudy('conditions-intersection', theme)
}
