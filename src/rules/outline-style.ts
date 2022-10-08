import { dash, OUTLINE, STYLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class OutlineStyle extends MasterCSSRule {
    static override matches = /^outline:(none|dotted|dashed|solid|double|groove|ridge|inset|outset)(?!\|)/;
    static override propName = dash(OUTLINE, STYLE);
}