import Rule from '../rule'

export default class extends Rule {
    static override id: 'BackgroundPosition' = 'BackgroundPosition' as const
    static override matches = /^(bg|background):(top|bottom|right|left|center)(?!\|)/
    static override unit = 'px'
}