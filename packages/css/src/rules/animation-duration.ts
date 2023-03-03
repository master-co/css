import { Rule } from '../'

export class AnimationDuration extends Rule {
    static override id = 'AnimationDuration' as const
    static override matches = '^@duration:.'
    static override unit = 'ms'
}