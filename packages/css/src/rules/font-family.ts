import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'FontFamily'
    static override matches = /^f(ont)?:(mono|sans|serif)(?!\|)/
    static override propName = 'font-family'
}