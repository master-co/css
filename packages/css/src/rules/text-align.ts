import { Rule } from '../rule'

export class TextAlign extends Rule {
    static id = 'TextAlign' as const
    static matches = '^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)'
}