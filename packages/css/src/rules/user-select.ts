import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'UserSelect'
    static override propName = 'user-select'
    override get(declaration): { [key: string]: any } {
        return {
            'user-select': declaration,
            '-webkit-user-select': declaration
        }
    }
}