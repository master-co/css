import { Style } from '@master/style';
import { CARET, COLOR, DASH } from './constants/css-property-keyword';

export class CaretColorStyle extends Style {
    static override key = CARET + DASH + COLOR;
    static override matches = /^caret:transparent(?!;)/;
    static override colorMatches = /^caret:(#|(rgb|hsl)\(.*\))((?!;).)*$/;
    static override colorful = true;
}