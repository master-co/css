import { MasterCSSRule } from '../rule';
import { BORDER, COLLAPSE, dash } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BorderCollapse'
    static override matches = /^b(order)?:(collapse|separate)(?!\|)/;
    static override propName = dash(BORDER, COLLAPSE);
}