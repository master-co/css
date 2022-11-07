import Rule from '../rule'

export default class extends Rule {
    static override id = 'AlignSelf'
    static override matches = /^as:./
}