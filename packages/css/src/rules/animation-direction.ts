import { Rule } from '../rule'

export class AnimationDirection extends Rule {
    static id = 'AnimationDirection' as const
    static matches = '^@direction:.'
}