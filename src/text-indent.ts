import { DASH, INDENT, TEXT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextIndentStyle extends MasterStyle {
    static override prefixes =  /^t(ext)?-indent:/;
    static override properties = [TEXT + DASH + INDENT];
    static override supportFullName = false;
}