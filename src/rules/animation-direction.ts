import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AnimationDirection'
    static override matches = /^@direction:./
    static override propName = 'animation-direction'
}