import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Gap'
    static override matches = /^gap(-x|-y)?:./
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        switch (this.prefix[4]) {
        case 'x':
            return { 'column-gap': declaration }
        case 'y':
            return { 'row-gap': declaration }
        default:
            return { gap: declaration }
        }
    }
    override order = -1
}