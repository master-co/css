import { Rule } from '../rule'

export class Color extends Rule {
    static id = 'Color' as const
    static matches = '^(?:color|fg|foreground):.'
    static colorful = true
    static unit = ''
}