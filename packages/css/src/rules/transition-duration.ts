import { Rule } from '../rule'

export class TransitionDuration extends Rule {
    static override id = 'TransitionDuration' as const
    static override matches = '^~duration:.'
    static override unit = 'ms'
}