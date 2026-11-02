import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'progressive-known-class',
  render: (theme: Theme) => renderStudy('progressive-known-class', theme)
}
