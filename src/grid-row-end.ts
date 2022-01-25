import { DASH, END, GRID, ROW } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridRowEndStyle extends Style {
    static override key = GRID + DASH + ROW + DASH + END;
    static override unit = '';
}