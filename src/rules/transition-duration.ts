import Rule from '../rule'

export default class extends Rule {
    static override id = 'TransitionDuration'
    static override matches = /^~duration:./
    static override unit = 'ms'
}