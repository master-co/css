import { Rule } from '../'

export default class extends Rule {
    static override id = 'TextOrientation' as const
    static override matches = '^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)'
}