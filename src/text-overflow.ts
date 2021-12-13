import { CLIP, DASH, ELLIPSIS, OVERFLOW, TEXT, T_PREFIX } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextOverflowStyle extends MasterStyle {
    static override prefixes = /^(t-overflow:|t:(ellipsis|clip))/;
    static override properties = [TEXT + DASH + OVERFLOW];
}