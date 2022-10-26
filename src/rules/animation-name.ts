import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AnimationName'
    static override matches = /^@name:./
    static override propName = 'animation-name'
}