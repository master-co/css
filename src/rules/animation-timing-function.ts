import Rule from '../rule'

export default class extends Rule {
    static override id: 'AnimationTimingFunction' = 'AnimationTimingFunction' as const
    static override matches = /^@easing:./
}