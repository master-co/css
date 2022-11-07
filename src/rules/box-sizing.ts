import Rule from '../rule'

export default class extends Rule {
    static override id = 'BoxSizing'
    static override matches = /^box:(content|border)(?!\|)/
}