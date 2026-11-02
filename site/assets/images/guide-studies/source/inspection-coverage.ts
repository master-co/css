import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'inspection-coverage',
  render: (theme: Theme) => renderStudy('inspection-coverage', theme)
}
