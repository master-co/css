import { ALIGN, dash, SELF } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class AlignSelf extends MasterCSSRule {
    static override matches =  /^as:./;
    static override key = dash(ALIGN, SELF);
}