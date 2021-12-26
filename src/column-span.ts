import { COLUMN, DASH, SPAN } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ColumnSpanStyle extends Style {
    static override matches = /^col-span:./;
    static override key = COLUMN + DASH + SPAN;
}