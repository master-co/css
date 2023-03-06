import { Rule } from '../rule'

export class AnimationTimingFunction extends Rule {
    static id = 'AnimationTimingFunction' as const
    static matches = '^@easing:.'
}