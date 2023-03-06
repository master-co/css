import { Rule } from '../rule'

export class AnimationPlayState extends Rule {
    static id = 'AnimationPlayState' as const
    static matches = '^@play-state:.'
}