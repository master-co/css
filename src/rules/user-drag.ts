import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'UserDrag'
    override get(declaration): { [key: string]: any } {
        return {
            'user-drag': declaration,
            '-webkit-user-drag': declaration
        }
    }
}