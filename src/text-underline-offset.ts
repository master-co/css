import { DASH, OFFSET, TEXT, UNDERLINE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextUnderlineOffsetStyle extends Style {
    static override key = TEXT + DASH + UNDERLINE + DASH + OFFSET;
}