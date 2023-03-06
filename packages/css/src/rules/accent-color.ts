import { Rule } from '../rule'

export class AccentColor extends Rule {
    static id = 'AccentColor' as const
    static colorStarts = 'accent:'
    static colorful = true
}