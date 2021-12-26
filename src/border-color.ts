import { Style } from '@master/style';
import { BORDER, COLOR, DASH } from './constants/css-property-keyword';

export class BorderColorStyle extends Style {
    static override matches = /^b-color:./;
    static override colorStarts = 'b(order)?:';
    static override key = BORDER + DASH + COLOR;
}