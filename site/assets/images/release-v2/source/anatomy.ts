import { renderRelease } from './scenes'
import type { Theme } from '../../rendering-modes/source/materials'
export default { id: 'anatomy', render: (theme: Theme) => renderRelease('anatomy', theme) }
