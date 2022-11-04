import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AnimationPlayState'
    static override matches = /^@play-state:./
}