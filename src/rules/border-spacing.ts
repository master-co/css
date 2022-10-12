import { MasterCSSRule } from '../rule';
import { BORDER, dash, SPACING } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BorderSpacing'
    static override propName = dash(BORDER, SPACING);
}