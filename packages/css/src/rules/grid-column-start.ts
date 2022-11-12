import Rule from '../rule'

export default class extends Rule {
    static override id: 'GridColumnStart' = 'GridColumnStart' as const
    static override matches = /^grid-col-start:./
    static override unit = ''
}