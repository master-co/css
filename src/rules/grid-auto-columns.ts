import Rule from '../rule'

export default class extends Rule {
    static override id = 'GridAutoColumns'
    static override matches = /^grid-auto-cols:./
}