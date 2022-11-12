import Rule from '../rule'

export default class extends Rule {
    static override id: 'AnimationPlayState' = 'AnimationPlayState' as const
    static override matches = /^@play-state:./
}