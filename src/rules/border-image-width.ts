import { MasterCSSRule } from '../rule';
import { BORDER, dash, IMAGE, WIDTH } from '../constants/css-property-keyword';

export class BorderImageWidth extends MasterCSSRule {
    static override matches = /^border-image:(?:\.?[0-9]|(max|min|calc|clamp)\(.*\))(?:(?!\|).)*$/;
    static override propName = dash(BORDER, IMAGE, WIDTH);
}