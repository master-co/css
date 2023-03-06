import { Rule } from '../rule'

export class AnimationDelay extends Rule {
    static id = 'AnimationDelay' as const
    static matches = '^@delay:.'
    static unit = 'ms'
}