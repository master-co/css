import { DASH, FONT, STYLE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FontStyleStyle extends MasterStyle {
    static override prefixes =  /^(f-style:|f:italic)/;
    static override properties = [FONT + DASH + STYLE];
}