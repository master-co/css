import { ALIGN, dash, ITEMS } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class AlignItems extends MasterCSSRule {
    static override matches =  /^ai:./;
    static override propName = dash(ALIGN, ITEMS);
}