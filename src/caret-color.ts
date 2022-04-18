import { Style } from '@master/style';
import { CARET, COLOR, DASH } from './constants/css-property-keyword';

export class CaretColor extends Style {
    static override key = CARET + DASH + COLOR;
    static override matches = /^caret:transparent(?!;)/;
    static override colorStarts = 'caret:';
    static override colorful = true;
}