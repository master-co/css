import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AnimationDelay'
    static override matches = /^@delay:./
    static override propName = 'animation-delay'
    static override unit = 'ms'
}