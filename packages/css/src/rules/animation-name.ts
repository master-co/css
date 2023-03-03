import { Rule } from '../'

export class AnimationName extends Rule {
    static override id = 'AnimationName' as const
    static override matches = '^@name:.'
}