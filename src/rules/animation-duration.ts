import Rule from '../rule'

export default class extends Rule {
    static override id = 'AnimationDuration'
    static override matches = /^@duration:./
    static override unit = 'ms'
}