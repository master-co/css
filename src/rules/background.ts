import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Background'
    static override matches = /^bg:./
    static override colorful = true
    override order = -1
}