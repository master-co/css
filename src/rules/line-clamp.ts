import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'LineClamp'
    static override unit = ''
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-line-clamp': declaration
        }
    }
}