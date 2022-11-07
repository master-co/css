import Rule from '../rule'

export default class extends Rule {
    static override id: 'TransitionDelay' = 'TransitionDelay' as const
    static override matches = /^~delay:./
    static override unit = 'ms'
}