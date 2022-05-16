import { COLUMN, dash, END, GRID } from '../constants/css-property-keyword';
import { Style } from '../style';

export class GridColumnEnd extends Style {
    static override matches = /^grid-col-end:./;
    static override key = dash(GRID, COLUMN, END);
    static override unit = '';
}