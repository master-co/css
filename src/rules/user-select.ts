import { MasterCSSRule } from '../rule';
import { dash, SELECT, USER } from '../constants/css-property-keyword';

export class UserSelect extends MasterCSSRule {
    static override propName = dash(USER, SELECT);
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            'user-select': propertyInfo,
            '-webkit-user-select': propertyInfo
        }
    };
}