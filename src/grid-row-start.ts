import { DASH, GRID, ROW } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridRowStartStyle extends Style {
    static override key = GRID + DASH + ROW + DASH + 'start';
    static override unit = '';
}