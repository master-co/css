import { Rule } from '../rule'

export class FontSize extends Rule {
    static id = 'FontSize' as const
    static matches = '^f(?:ont)?:(?:[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}