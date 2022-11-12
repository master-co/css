import Rule from '../rule'

export default class extends Rule {
    static override id: 'AnimationDuration' = 'AnimationDuration' as const
    static override matches = /^@duration:./
    static override unit = 'ms'
}