import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'pipes-and-quotes',
  render: (theme: Theme) => renderStudy('pipes-and-quotes', theme)
}
