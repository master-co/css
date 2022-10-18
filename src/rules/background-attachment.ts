import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BackgroundAttachment'
    static override matches = /^(bg|background):(fixed|local|scroll)(?!\|)/
    static override propName = 'background-attachment'
}