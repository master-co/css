import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'editor-build-boundary',
  render: (theme: Theme) => renderStudy('editor-build-boundary', theme)
}
