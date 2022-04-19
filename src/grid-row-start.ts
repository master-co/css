import { dash, GRID, ROW, START } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridRowStart extends Style {
    static override key = dash(GRID, ROW, START);
    static override unit = '';
}