import { DASH, FONT, STYLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontStyleStyle extends Style {
    static override prefixes =  /^(f-style:|f(ont)?:italic)/;
    static override property = FONT + DASH + STYLE;
}