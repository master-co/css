import { Rule } from '../rule'

export class TransitionDelay extends Rule {
    static override id = 'TransitionDelay' as const
    static override matches = '^~delay:.'
    static override unit = 'ms'
}