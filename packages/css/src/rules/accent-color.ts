import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AccentColor'
    static override propName = 'accent-color'
    static override colorStarts = 'accent:'
    static override colorful = true
}