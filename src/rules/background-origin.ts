import Rule from '../rule'

export default class extends Rule {
    static override id: 'BackgroundOrigin' = 'BackgroundOrigin' as const
    static override matches = /^(bg|background):(content|border|padding)(?!\|)/
}