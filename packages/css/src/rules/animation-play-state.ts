import { Rule } from '../'

export class AnimationPlayState extends Rule {
    static override id = 'AnimationPlayState' as const
    static override matches = '^@play-state:.'
}