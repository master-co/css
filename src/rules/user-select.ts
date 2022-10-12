import { MasterCSSRule } from '../rule';
import { dash, SELECT, USER } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'UserSelect'
    static override propName = dash(USER, SELECT);
    override get(declaration): { [key: string]: any } {
        return {
            'user-select': declaration,
            '-webkit-user-select': declaration
        }
    };
}