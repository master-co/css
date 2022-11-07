import Rule from '../rule'

export default class extends Rule {
    static override id: 'TransitionDuration' = 'TransitionDuration' as const
    static override matches = /^~duration:./
    static override unit = 'ms'
}