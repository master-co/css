import Rule from '../rule'

export default class extends Rule {
    static override id = 'AlignItems'
    static override matches = /^ai:./
}