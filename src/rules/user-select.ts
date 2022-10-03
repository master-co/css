import { MasterCSSRule } from '../rule';
import { dash, SELECT, USER } from '../constants/css-property-keyword';

export class UserSelect extends MasterCSSRule {
    static override key = dash(USER, SELECT);
    override get props(): { [key: string]: any } {
        return {
            'user-select': this,
            '-webkit-user-select': this
        }
    };
}