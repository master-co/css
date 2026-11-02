import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'width-cap-growth',
  render: (theme: Theme) => renderStudy('width-cap-growth', theme)
}
