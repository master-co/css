import { AUTO, DASH, GRID, ROWS } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoRowsStyle extends Style {
    static override properties = [GRID + DASH + AUTO + DASH + ROWS];

}