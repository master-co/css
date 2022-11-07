import Rule from '../rule'

export default class extends Rule {
    static override id = 'BackgroundAttachment'
    static override matches = /^(bg|background):(fixed|local|scroll)(?!\|)/
}