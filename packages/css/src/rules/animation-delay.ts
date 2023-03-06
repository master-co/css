import { Rule } from '../rule'

export class AnimationDelay extends Rule {
    static override id = 'AnimationDelay' as const
    static override matches = '^@delay:.'
    static override unit = 'ms'
}