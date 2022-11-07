import Rule from '../rule'

export default class extends Rule {
    static override id = 'AnimationName'
    static override matches = /^@name:./
}