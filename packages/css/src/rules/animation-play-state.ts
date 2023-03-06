import { Rule } from '../rule'

export class AnimationPlayState extends Rule {
    static override id = 'AnimationPlayState' as const
    static override matches = '^@play-state:.'
}