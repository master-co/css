import { Rule } from '../rule'

export class ClipPath extends Rule {
    static id = 'ClipPath' as const
    static matches = '^clip:.'
}