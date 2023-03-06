import { Rule } from '../rule'

export class TextOrientation extends Rule {
    static id = 'TextOrientation' as const
    static matches = '^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)'
}