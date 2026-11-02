import { renderRelease } from './scenes'
import type { Theme } from '../../rendering-modes/source/materials'
export default { id: 'tokens', render: (theme: Theme) => renderRelease('tokens', theme) }
