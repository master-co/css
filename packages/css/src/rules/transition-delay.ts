import { Rule } from '../rule'

export class TransitionDelay extends Rule {
    static id = 'TransitionDelay' as const
    static matches = '^~delay:.'
    static unit = 'ms'
}