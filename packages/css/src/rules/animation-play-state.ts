import { Rule } from '../'

export default class extends Rule {
    static override id = 'AnimationPlayState' as const
    static override matches = '^@play-state:.'
}