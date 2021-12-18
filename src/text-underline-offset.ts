import { DASH, OFFSET, TEXT, UNDERLINE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextUnderlineOffsetStyle extends Style {
    static override prefixes =  /^t(ext)?-underline-offset:/;
    static override property = TEXT + DASH + UNDERLINE + DASH + OFFSET;
    static override supportFullName = false;
}