import Rule from '../rule'

export default class extends Rule {
    static override id = 'MinWidth'
    static override matches = /^min-w:./
}