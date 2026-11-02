import { renderStudy } from './render-study'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'stable-dynamic-value',
  render: (theme: Theme) => renderStudy('stable-dynamic-value', theme)
}
