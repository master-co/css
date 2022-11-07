import Rule from '../rule'

export default class extends Rule {
    static override id: 'GridColumnEnd' = 'GridColumnEnd' as const
    static override matches = /^grid-col-end:./
    static override unit = ''
}