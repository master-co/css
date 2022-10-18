import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AnimationDuration'
    static override matches = /^@duration:./
    static override propName = 'animation-duration'
    static override unit = 'ms'
}