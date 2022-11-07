import Rule from '../rule'

export default class extends Rule {
    static override id = 'Display'
    static override matches = /^d:./
}