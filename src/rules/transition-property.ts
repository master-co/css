import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TransitionProperty'
    static override matches = /^~property:./
    static override propName = 'transition-property'
}