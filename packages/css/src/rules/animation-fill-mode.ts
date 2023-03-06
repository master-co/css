import { Rule } from '../rule'

export class AnimationFillMode extends Rule {
    static override id = 'AnimationFillMode' as const
    static override matches = '^@fill-mode:.'
}