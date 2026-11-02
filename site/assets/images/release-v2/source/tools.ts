import { renderRelease } from './scenes'
import type { Theme } from '../../rendering-modes/source/materials'
export default { id: 'tools', render: (theme: Theme) => renderRelease('tools', theme) }
