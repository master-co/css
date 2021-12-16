import { DASH, OFFSET, TEXT, UNDERLINE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextUnderlineOffsetStyle extends MasterStyle {
    static override prefixes =  /^t(ext)?-underline-offset:/;
    static override properties = [TEXT + DASH + UNDERLINE + DASH + OFFSET];
    static override supportFullName = false;
}