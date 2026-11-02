import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'responsive-local-change',
  render: (theme: Theme) => renderStudy('responsive-local-change', theme)
}
