import { dash, JUSTIFY, SELF } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class JustifySelf extends MasterCSSRule {
    static override matches =  /^js:./;
    static override key = dash(JUSTIFY, SELF);
}