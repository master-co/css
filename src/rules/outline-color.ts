import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'OutlineColor'
    static override colorStarts = 'outline:'
    static override colorful = true
}