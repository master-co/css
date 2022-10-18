import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AnimationFillMode'
    static override matches = /^@fill-mode:./
    static override propName = 'animation-fill-mode'
}