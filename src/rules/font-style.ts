import Rule from '../rule'

export default class extends Rule {
    static override id: 'FontStyle' = 'FontStyle' as const
    static override matches = /^f(ont)?:(normal|italic|oblique)(?!\|)/
    static override unit = 'deg'
}