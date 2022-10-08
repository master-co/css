import { MasterCSSRule } from '../rule';
import { BORDER, COLLAPSE, dash } from '../constants/css-property-keyword';

export class BorderCollapse extends MasterCSSRule {
    static override matches = /^b(order)?:(collapse|separate)(?!\|)/;
    static override propName = dash(BORDER, COLLAPSE);
}