import { MasterCSSRule } from '../rule';
import { BORDER, dash, IMAGE, REPEAT } from '../constants/css-property-keyword';

export class BorderImageRepeat extends MasterCSSRule {
    static override matches = /^border-image:(?:stretch|repeat|round|space)(?:(?!\|).)*$/;
    static override key = dash(BORDER, IMAGE, REPEAT);
}