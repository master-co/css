import Rule from '../rule'

export default class extends Rule {
    static override id = 'AnimationTimingFunction' as const
    static override matches = '^@easing:.'
}