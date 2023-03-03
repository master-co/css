import { Rule } from '../'

export default class extends Rule {
    static override id = 'OutlineColor' as const
    static override colorStarts = 'outline:'
    static override colorful = true
}