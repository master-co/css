import { Rule } from '../rule'

export class AnimationTimingFunction extends Rule {
    static override id = 'AnimationTimingFunction' as const
    static override matches = '^@easing:.'
}