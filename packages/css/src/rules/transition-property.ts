import { Rule } from '../rule'

export class TransitionProperty extends Rule {
    static id = 'TransitionProperty' as const
    static matches = '^~property:.'
}