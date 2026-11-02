import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'local-color-scheme',
  render: (theme: Theme) => renderStudy('local-color-scheme', theme)
}
