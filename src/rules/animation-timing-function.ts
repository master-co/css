import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AnimationTimingFunction'
    static override matches = /^@easing:./
}