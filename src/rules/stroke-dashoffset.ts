import { dash, OFFSET, STROKE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class StrokeDashoffset extends MasterCSSRule {
    static override propName = dash(STROKE, 'dash') + OFFSET;
}