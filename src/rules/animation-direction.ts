import Rule from '../rule'

export default class extends Rule {
    static override id = 'AnimationDirection'
    static override matches = /^@direction:./
}