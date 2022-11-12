import Rule from '../rule'

export default class extends Rule {
    static override id: 'Height' = 'Height' as const
    static override matches = /^h:./

}