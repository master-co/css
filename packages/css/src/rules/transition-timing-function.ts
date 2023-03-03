import { Rule } from '../'

export class TransitionTimingFunction extends Rule {
    static override id = 'TransitionTimingFunction' as const
    static override matches = '^~easing:.'
}