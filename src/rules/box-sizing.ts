import { BORDER, BOX, CONTENT, dash, SIZING } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class BoxSizing extends MasterCSSRule {
    static override matches = /^box:(content|border)(?!\|)/;
    static override propName = dash(BOX, SIZING);
}