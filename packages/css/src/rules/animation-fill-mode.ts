import { Rule } from '../rule'

export class AnimationFillMode extends Rule {
    static id = 'AnimationFillMode' as const
    static matches = '^@fill-mode:.'
}