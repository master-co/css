import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextOrientation'
    static override matches = /^t(ext)?:(mixed|upright|sideways-right|sideways|use-glyph-orientation)(?!\|)/
}