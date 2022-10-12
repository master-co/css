import { dash, OUTLINE, STYLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'OutlineStyle'
    static override matches = /^outline:(none|dotted|dashed|solid|double|groove|ridge|inset|outset)(?!\|)/;
    static override propName = dash(OUTLINE, STYLE);
}