import { Rule } from '../'

export default class extends Rule {
    static override id = 'Color' as const
    static override matches = '^(?:color|fg|foreground):.'
    static override colorful = true
    static override unit = ''
}