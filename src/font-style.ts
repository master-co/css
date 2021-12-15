import { DASH, FONT, STYLE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FontStyleStyle extends MasterStyle {
    static override prefixes =  /^(f(ont)?-style:|f(ont)?:italic)/;
    static override supportFullName = false;
    static override properties = [FONT + DASH + STYLE];
}