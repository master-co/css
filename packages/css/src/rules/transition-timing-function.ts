import { Rule } from '../rule'

export class TransitionTimingFunction extends Rule {
    static id = 'TransitionTimingFunction' as const
    static matches = '^~easing:.'
}