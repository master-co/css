import { Style } from '@master/style';
import { BORDER, DASH, STYLE } from './constants/css-property-keyword';

export class BorderStyleStyle extends Style {
    static override matches = /^b-style:.|b(order)?:(dotted|dashed|solid|double|groove|ridge|inset|outset)(?!;)/;
    static override key = BORDER + DASH + STYLE;
}