import { Rule } from '../rule'

export class TextDecorationStyle extends Rule {
    static id = 'TextDecorationStyle' as const
    static matches = '^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)'
}