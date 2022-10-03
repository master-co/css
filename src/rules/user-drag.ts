import { MasterCSSRule } from '../rule';
import { dash, DRAG, USER } from '../constants/css-property-keyword';

export class UserDrag extends MasterCSSRule {
    static override key = dash(USER, DRAG);
    override get props(): { [key: string]: any } {
        return {
            'user-drag': this,
            '-webkit-user-drag': this
        }
    };
}