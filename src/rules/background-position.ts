import { MasterCSSRule } from '../rule';
import { BACKGROUND, dash, POSITION, PX } from '../constants/css-property-keyword';

export class BackgroundPosition extends MasterCSSRule {
    static override matches = /^(bg|background):(top|bottom|right|left|center)(?!\|)/;
    static override key = dash(BACKGROUND, POSITION);
    static override unit = PX;
}