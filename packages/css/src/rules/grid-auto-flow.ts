import { Rule } from '../'

export default class extends Rule {
    static override id = 'GridAutoFlow' as const
    static override matches = '^grid-flow:.'
}