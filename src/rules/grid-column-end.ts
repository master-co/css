import Rule from '../rule'

export default class extends Rule {
    static override id = 'GridColumnEnd'
    static override matches = /^grid-col-end:./
    static override unit = ''
}