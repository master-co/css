import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'UserDrag'
    static override propName = 'user-drag'
    override get(declaration): { [key: string]: any } {
        return {
            'user-drag': declaration,
            '-webkit-user-drag': declaration
        }
    };
}