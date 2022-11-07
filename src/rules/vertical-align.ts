import Rule from '../rule'

export default class extends Rule {
    static override id = 'VerticalAlign'
    static override matches = /^(?:v|vertical):./
}