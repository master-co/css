import { MasterCSSRule } from '../rule';
import { BACKGROUND, BORDER, BOX, CONTENT, dash, ORIGIN, PADDING } from '../constants/css-property-keyword';

export class BackgroundOrigin extends MasterCSSRule {
    static override matches = /^(bg|background):(content|border|padding)(?!\|)/;
    static override propName = dash(BACKGROUND, ORIGIN);
}