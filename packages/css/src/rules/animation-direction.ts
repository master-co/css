import { Rule } from '../rule'

export class AnimationDirection extends Rule {
    static override id = 'AnimationDirection' as const
    static override matches = '^@direction:.'
}