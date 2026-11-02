import { renderRelease } from './scenes'
import type { Theme } from '../../rendering-modes/source/materials'
export default { id: 'layers', render: (theme: Theme) => renderRelease('layers', theme) }
