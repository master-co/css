import { renderRelease } from './scenes'
import type { Theme } from '../../rendering-modes/source/materials'
export default { id: 'delivery', render: (theme: Theme) => renderRelease('delivery', theme) }
