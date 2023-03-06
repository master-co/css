import { Rule } from '../rule'

export class TextDecorationStyle extends Rule {
    static override id = 'TextDecorationStyle' as const
    static override matches = '^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)'
}