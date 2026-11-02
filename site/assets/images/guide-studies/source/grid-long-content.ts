import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'grid-long-content',
  render: (theme: Theme) => renderStudy('grid-long-content', theme)
}
