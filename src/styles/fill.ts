import { CURRENT_COLOR, FILL } from '../constants/css-property-keyword';
import { Style } from '../style';

export class Fill extends Style {
    static override key = FILL;
    static override colorStarts = 'fill:';
    static override colorful = true;
}