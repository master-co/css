import Rule from '../rule'

export default class extends Rule {
    static override id: 'JustifyItems' = 'JustifyItems' as const
    static override matches =  /^ji:./

}