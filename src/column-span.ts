import { COLUMN, DASH, SPAN } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class ColumnSpanStyle extends MasterStyle {
    static override prefixes = /^col-span:/;
    static override properties = [COLUMN + DASH + SPAN];
}