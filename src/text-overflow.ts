import { DASH, OVERFLOW, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextOverflowStyle extends Style {
    static override prefixes = /^(t(ext)?-(overflow|ovf):|t(ext)?:(ellipsis|clip))/;
    static override property = TEXT + DASH + OVERFLOW;
    static override supportFullName = false;
}