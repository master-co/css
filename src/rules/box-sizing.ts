import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BoxSizing'
    static override matches = /^box:(content|border)(?!\|)/
    static override propName = 'box-sizing'
}