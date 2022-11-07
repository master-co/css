import Rule from '../rule'

export default class extends Rule {
    static override id = 'TransitionDelay'
    static override matches = /^~delay:./
    static override unit = 'ms'
}