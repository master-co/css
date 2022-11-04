import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TransitionDelay'
    static override matches = /^~delay:./
    static override unit = 'ms'
}