import Rule from '../rule'

export default class extends Rule {
    static override id = 'Height'
    static override matches = /^h:./

}