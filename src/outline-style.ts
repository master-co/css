import { DASH, OUTLINE, STYLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class OutlineStyleStyle extends Style {
    static override matches = /^outline:(dotted|dashed|solid|double|groove|ridge|inset|outset)(?!;)/;
    static override key = OUTLINE + DASH + STYLE;
}