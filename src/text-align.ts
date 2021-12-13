import { ALIGN, DASH, TEXT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextAlignStyle extends MasterStyle {
    static override prefixes =  /^(t-align:|t:(top|center|left|right))/;
    static override properties = [TEXT + DASH + ALIGN];
}