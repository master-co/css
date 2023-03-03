import { Rule } from '../'

export class TextAlign extends Rule {
    static override id = 'TextAlign' as const
    static override matches = '^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)'
}