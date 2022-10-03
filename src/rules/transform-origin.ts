import { dash, ORIGIN, PX, TRANSFORM } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TransformOrigin extends MasterCSSRule {
    static override matches = /^transform:((top|bottom|right|left|center)|\d)/;
    static override key = dash(TRANSFORM, ORIGIN);
    static override unit = PX;
}