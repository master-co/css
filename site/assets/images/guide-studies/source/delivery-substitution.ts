import { renderStudy } from './render-study'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'delivery-substitution',
  render: (theme: Theme) => renderStudy('delivery-substitution', theme)
}
