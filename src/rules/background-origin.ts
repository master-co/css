import { MasterCSSRule } from '../rule';
import { BACKGROUND, BORDER, BOX, CONTENT, dash, ORIGIN, PADDING } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BackgroundOrigin'
    static override matches = /^(bg|background):(content|border|padding)(?!\|)/;
    static override propName = dash(BACKGROUND, ORIGIN);
}