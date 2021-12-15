import { DASH, FONT, F_PREFIX, ITALIC, STYLE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FontStyleStyle extends MasterStyle {
    static override prefixes =  /^(f|font)-style/;
    static override properties = [FONT + DASH + STYLE];
    static override semantics = {
        [F_PREFIX + ITALIC]: ITALIC
    }
}