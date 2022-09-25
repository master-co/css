import { COLOR, CURRENT_COLOR } from '../constants/css-property-keyword';
import { Style } from '../style';

export class Color extends Style {
    static override colorStarts = '(?:color|fg|foreground):';
    static override colorful = true;
    static override key = COLOR;
    static override unit = '';
}