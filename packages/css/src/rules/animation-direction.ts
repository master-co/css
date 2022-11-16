import Rule from '../rule'

export default class extends Rule {
    static override id: 'AnimationDirection' = 'AnimationDirection' as const
    static override matches = /^@direction:./
}