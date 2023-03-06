import { Rule } from '../rule'

export class TextDecorationThickness extends Rule {
    static override id = 'TextDecorationThickness' as const
    static override matches = '^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$'
    static override unit = 'em'
}