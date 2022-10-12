import { BORDER, BOX, CONTENT, dash, SIZING } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'BoxSizing'
    static override matches = /^box:(content|border)(?!\|)/;
    static override propName = dash(BOX, SIZING);
}