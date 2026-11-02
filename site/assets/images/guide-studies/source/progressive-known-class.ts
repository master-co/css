import { renderStudy } from './render-study'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'progressive-known-class',
  render: (theme: Theme) => renderStudy('progressive-known-class', theme)
}
