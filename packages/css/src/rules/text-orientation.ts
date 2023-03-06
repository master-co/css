import { Rule } from '../rule'

export class TextOrientation extends Rule {
    static override id = 'TextOrientation' as const
    static override matches = '^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)'
}