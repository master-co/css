import { Style } from '../style';
import { CARET, COLOR, dash } from '../constants/css-property-keyword';

export class CaretColor extends Style {
    static override key = dash(CARET, COLOR);
    static override colorStarts = 'caret:';
    static override colorful = true;
}