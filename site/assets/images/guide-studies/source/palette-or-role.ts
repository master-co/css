import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'palette-or-role',
  render: (theme: Theme) => renderStudy('palette-or-role', theme)
}
