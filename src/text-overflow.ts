import { DASH, OVERFLOW, TEXT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextOverflowStyle extends MasterStyle {
    static override prefixes = /^(t(ext)?-(overflow|ovf):|t(ext)?:(ellipsis|clip))/;
    static override properties = [TEXT + DASH + OVERFLOW];
    static override supportFullName = false;
}