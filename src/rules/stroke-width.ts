import { dash, STROKE, WIDTH } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class StrokeWidth extends MasterCSSRule {
    static override matches = /^stroke:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/;
    static override key = dash(STROKE, WIDTH);
}