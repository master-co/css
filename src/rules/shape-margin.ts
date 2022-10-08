import { MasterCSSRule } from '../rule';
import { dash, MARGIN, SHAPE } from '../constants/css-property-keyword';

export class ShapeMargin extends MasterCSSRule {
    static override matches = /^shape:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/
    static override propName = dash(SHAPE, MARGIN);
}