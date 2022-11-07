import Rule from '../rule'

export default class extends Rule {
    static override id: 'MinWidth' = 'MinWidth' as const
    static override matches = /^min-w:./
}