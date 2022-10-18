import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BackgroundOrigin'
    static override matches = /^(bg|background):(content|border|padding)(?!\|)/
    static override propName = 'background-origin'
}