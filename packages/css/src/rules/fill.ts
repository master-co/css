import { Rule } from '../'

export default class extends Rule {
    static override id = 'Fill' as const
    static override colorStarts = 'fill:'
    static override colorful = true
}