import { Rule } from '../rule'

export class ClipPath extends Rule {
    static override id = 'ClipPath' as const
    static override matches = '^clip:.'
}