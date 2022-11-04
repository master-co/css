import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Color'
    static override colorStarts = '(?:color|fg|foreground):'
    static override colorful = true
    static override unit = ''
}