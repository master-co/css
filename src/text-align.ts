import { ALIGN, DASH, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextAlignStyle extends Style {
    static override prefixes =  /^t(ext)?:(justify|center|left|right)/;
    static override properties = [TEXT + DASH + ALIGN];
}