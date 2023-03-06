import { Rule } from '../rule'

export class BackgroundColor extends Rule {
    static id = 'BackgroundColor' as const
    static colorStarts = '(?:bg|background):'
    static unit = ''
    static colorful = true
}