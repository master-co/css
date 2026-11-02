import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'language-and-delivery',
  render: (theme: Theme) => renderStudy('language-and-delivery', theme)
}
