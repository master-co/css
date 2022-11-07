import Rule from '../rule'

export default class extends Rule {
    static override id = 'BackgroundOrigin'
    static override matches = /^(bg|background):(content|border|padding)(?!\|)/
}