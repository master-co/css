import { MasterCSSRule } from '../rule';
import { dash, MARGIN, SHAPE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'ShapeMargin'
    static override matches = /^shape:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/
    static override propName = dash(SHAPE, MARGIN);
}