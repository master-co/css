import { COLUMN, DASH, GRID, START } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridColumnStartStyle extends Style {
    static override matches = /^grid-col-start:./;
    static override key = GRID + DASH + COLUMN + DASH + START;
    static override unit = '';
}