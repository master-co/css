import { DASH, LAYOUT, TABLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TableLayout extends Style {
    static override key = TABLE + DASH + LAYOUT;
}