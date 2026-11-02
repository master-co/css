import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'static-late-class',
  render: (theme: Theme) => renderStudy('static-late-class', theme)
}
