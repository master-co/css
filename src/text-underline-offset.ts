import { DASH, OFFSET, TEXT, UNDERLINE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextUnderlineOffsetStyle extends Style {
    static override matches =  /^t-underline-offset:./;
    static override key = TEXT + DASH + UNDERLINE + DASH + OFFSET;
}