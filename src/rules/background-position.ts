import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BackgroundPosition'
    static override matches = /^(bg|background):(top|bottom|right|left|center)(?!\|)/
    static override unit = 'px'
}