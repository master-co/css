import Rule from '../rule'

export default class extends Rule {
    static override id = 'AnimationTimingFunction'
    static override matches = /^@easing:./
}