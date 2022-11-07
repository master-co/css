import Rule from '../rule'

export default class extends Rule {
    static override id = 'AnimationFillMode'
    static override matches = /^@fill-mode:./
}