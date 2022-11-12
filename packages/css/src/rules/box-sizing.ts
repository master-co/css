import Rule from '../rule'

export default class extends Rule {
    static override id: 'BoxSizing' = 'BoxSizing' as const
    static override matches = /^box:(content|border)(?!\|)/
}