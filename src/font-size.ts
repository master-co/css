import { DASH, FONT, SIZE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontSizeStyle extends Style {
    static override prefixes = /^(f(ont)?-size:|f(ont)?:[0-9])/;
    static override supportFullName = false;
    static override property = FONT + DASH + SIZE;
}