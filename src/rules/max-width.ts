import Rule from '../rule'

export default class extends Rule {
    static override id = 'MaxWidth'
    static override matches = /^max-w:./
}