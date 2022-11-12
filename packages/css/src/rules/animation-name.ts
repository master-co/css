import Rule from '../rule'

export default class extends Rule {
    static override id: 'AnimationName' = 'AnimationName' as const
    static override matches = /^@name:./
}