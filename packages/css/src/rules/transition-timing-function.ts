import { Rule } from '../'

export default class extends Rule {
    static override id = 'TransitionTimingFunction' as const
    static override matches = '^~easing:.'
}