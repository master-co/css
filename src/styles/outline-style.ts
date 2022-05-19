import { dash, OUTLINE, STYLE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class OutlineStyle extends Style {
    static override matches = /^outline:(none|dotted|dashed|solid|double|groove|ridge|inset|outset)(?!\|)/;
    static override key = dash(OUTLINE, STYLE);
}