import { CONTENT, dash, JUSTIFY } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class JustifyContent extends MasterCSSRule {
    static override matches =  /^jc:./;
    static override propName = dash(JUSTIFY, CONTENT);

}