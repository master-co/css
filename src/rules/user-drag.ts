import { MasterCSSRule } from '../rule';
import { dash, DRAG, USER } from '../constants/css-property-keyword';

export class UserDrag extends MasterCSSRule {
    static override propName = dash(USER, DRAG); 
    override get(declaration): { [key: string]: any } {
        return {
            'user-drag': declaration,
            '-webkit-user-drag': declaration
        }
    };
}