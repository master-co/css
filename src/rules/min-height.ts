import Rule from '../rule'

export default class extends Rule {
    static override id = 'MinHeight'
    static override matches = /^min-h:./
}