import { MasterCSSRule } from '../rule';
import { BORDER, dash, SPACING } from '../constants/css-property-keyword';

export class BorderSpacing extends MasterCSSRule {
    static override propName = dash(BORDER, SPACING);
}