import { MasterCSSRule } from '../rule';
import { BORDER, dash, IMAGE, REPEAT } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BorderImageRepeat'
    static override matches = /^border-image:(?:stretch|repeat|round|space)(?:(?!\|).)*$/;
    static override propName = dash(BORDER, IMAGE, REPEAT);
}