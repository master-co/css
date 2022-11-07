import Rule from '../rule'

export default class extends Rule {
    static override id: 'TransitionProperty' = 'TransitionProperty' as const
    static override matches = /^~property:./
}