import { Rule } from '../rule'

export class TextDecorationThickness extends Rule {
    static id = 'TextDecorationThickness' as const
    static matches = '^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$'
    static unit = 'em'
}