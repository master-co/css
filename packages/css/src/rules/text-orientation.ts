import Rule from '../rule'

export default class extends Rule {
    static override id: 'TextOrientation' = 'TextOrientation' as const
    static override matches = /^t(ext)?:(mixed|upright|sideways-right|sideways|use-glyph-orientation)(?!\|)/
}