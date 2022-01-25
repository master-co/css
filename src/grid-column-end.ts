import { COLUMN, DASH, END, GRID } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridColumnEndStyle extends Style {
    static override matches = /^grid-col-end:./;
    static override key = GRID + DASH + COLUMN + DASH + END;
    static override unit = '';
}