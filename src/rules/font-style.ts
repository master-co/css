import Rule from '../rule'

export default class extends Rule {
    static override id = 'FontStyle'
    static override matches = /^f(ont)?:(normal|italic|oblique)(?!\|)/
    static override unit = 'deg'
}