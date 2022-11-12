import Rule from '../rule'

export default class extends Rule {
    static override id: 'Color' = 'Color' as const
    static override colorStarts = '(?:color|fg|foreground):'
    static override colorful = true
    static override unit = ''
}