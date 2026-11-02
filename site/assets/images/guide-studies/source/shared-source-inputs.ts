import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'shared-source-inputs',
  render: (theme: Theme) => renderStudy('shared-source-inputs', theme)
}
