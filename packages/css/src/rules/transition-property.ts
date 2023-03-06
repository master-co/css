import { Rule } from '../rule'

export class TransitionProperty extends Rule {
    static override id = 'TransitionProperty' as const
    static override matches = '^~property:.'
}