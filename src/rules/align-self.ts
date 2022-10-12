import { ALIGN, dash, SELF } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AlignSelf'
    static override matches =  /^as:./;
    static override propName = dash(ALIGN, SELF);
}