import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'delivery-not-scope',
  render: (theme: Theme) => renderStudy('delivery-not-scope', theme)
}
