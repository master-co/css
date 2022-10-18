import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TransformOrigin'
    static override matches = /^transform:((top|bottom|right|left|center)|\d)/
    static override propName = 'transform-origin'
    static override unit = 'px'
}