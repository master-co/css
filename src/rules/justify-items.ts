import Rule from '../rule'

export default class extends Rule {
    static override id = 'JustifyItems'
    static override matches =  /^ji:./

}