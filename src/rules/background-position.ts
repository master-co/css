import { MasterCSSRule } from '../rule';
import { BACKGROUND, dash, POSITION, PX } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BackgroundPosition'
    static override matches = /^(bg|background):(top|bottom|right|left|center)(?!\|)/;
    static override propName = dash(BACKGROUND, POSITION);
    static override unit = PX;
}