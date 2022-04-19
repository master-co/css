import { dash, END, GRID, ROW } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridRowEnd extends Style {
    static override key = dash(GRID, ROW, END);
    static override unit = '';
}