import { Rule } from '../rule'

export class AnimationName extends Rule {
    static override id = 'AnimationName' as const
    static override matches = '^@name:.'
}