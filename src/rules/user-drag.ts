import { MasterCSSRule } from '../rule';
import { dash, DRAG, USER } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'UserDrag'
    static override propName = dash(USER, DRAG); 
    override get(declaration): { [key: string]: any } {
        return {
            'user-drag': declaration,
            '-webkit-user-drag': declaration
        }
    };
}