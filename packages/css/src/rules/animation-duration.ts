import { Rule } from '../rule'

export class AnimationDuration extends Rule {
    static id = 'AnimationDuration' as const
    static matches = '^@duration:.'
    static unit = 'ms'
}