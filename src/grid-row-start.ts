import { DASH, GRID, ROW, START } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridRowStart extends Style {
    static override key = GRID + DASH + ROW + DASH + START;
    static override unit = '';
}