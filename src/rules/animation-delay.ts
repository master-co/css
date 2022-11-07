import Rule from '../rule'

export default class extends Rule {
    static override id = 'AnimationDelay'
    static override matches = /^@delay:./
    static override unit = 'ms'
}