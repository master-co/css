import { DASH, FONT, SIZE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterFontSizeStyle extends MasterStyle {
    static override prefixes = /^(f-size:|f:[0-9])/;
    static override properties = [FONT + DASH + SIZE];
}