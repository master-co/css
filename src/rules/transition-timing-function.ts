import Rule from '../rule'

export default class extends Rule {
    static override id = 'TransitionTimingFunction'
    static override matches = /^~easing:./
}