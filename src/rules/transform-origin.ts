import { dash, ORIGIN, PX, TRANSFORM } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TransformOrigin'
    static override matches = /^transform:((top|bottom|right|left|center)|\d)/;
    static override propName = dash(TRANSFORM, ORIGIN);
    static override unit = PX;
}