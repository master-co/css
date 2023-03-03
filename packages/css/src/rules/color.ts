import { Rule } from '../'

export class Color extends Rule {
    static override id = 'Color' as const
    static override matches = '^(?:color|fg|foreground):.'
    static override colorful = true
    static override unit = ''
}