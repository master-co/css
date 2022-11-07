import Rule from '../rule'

export default class extends Rule {
    static override id = 'WritingMode'
    static override matches = /^writing:./
}