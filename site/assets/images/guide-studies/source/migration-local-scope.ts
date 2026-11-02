import { renderStudy } from './render-study'
import type { Theme } from '../../rendering-modes/source/materials'

// Lesson and text equivalent: content/guide/studies.ts.
export default {
  id: 'migration-local-scope',
  render: (theme: Theme) => renderStudy('migration-local-scope', theme)
}
