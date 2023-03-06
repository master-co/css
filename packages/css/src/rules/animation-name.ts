import { Rule } from '../rule'

export class AnimationName extends Rule {
    static id = 'AnimationName' as const
    static matches = '^@name:.'
}