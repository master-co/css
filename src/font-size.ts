import { DASH, FONT, SIZE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FontSizeStyle extends MasterStyle {
    static override prefixes = /^(f(ont)?-size:|f(ont)?:[0-9])/;
    static override supportFullName = false;
    static override properties = [FONT + DASH + SIZE];
}