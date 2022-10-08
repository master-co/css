import { dash, STYLE, TRANSFORM } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TransformStyle extends MasterCSSRule {
    static override matches = /^transform:(flat|preserve-3d)(?!\|)/;
    static override propName = dash(TRANSFORM, STYLE);
}