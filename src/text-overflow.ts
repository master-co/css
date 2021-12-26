import { DASH, OVERFLOW, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextOverflowStyle extends Style {
    static override matches = /^(t(ext)?-(overflow|ovf):|t(ext)?:(ellipsis|clip))/;
    static override key = TEXT + DASH + OVERFLOW;
}