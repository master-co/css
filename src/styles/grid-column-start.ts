import { COLUMN, dash, GRID, START } from '../constants/css-property-keyword';
import { Style } from '../style';

export class GridColumnStart extends Style {
    static override matches = /^grid-col-start:./;
    static override key = dash(GRID, COLUMN, START);
    static override unit = '';
}