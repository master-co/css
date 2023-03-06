import { Rule } from '../rule'

export class TransitionDuration extends Rule {
    static id = 'TransitionDuration' as const
    static matches = '^~duration:.'
    static unit = 'ms'
}