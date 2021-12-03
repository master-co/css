import { DASH, FONT, STYLE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterFontStyleStyle extends MasterStyle {
    static override prefixes =  /^(f-style:|f:italic)/;
    static override properties = [FONT + DASH + STYLE];
}