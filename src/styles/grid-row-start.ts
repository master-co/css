import { dash, GRID, ROW, START } from '../constants/css-property-keyword';
import { Style } from '../style';

export class GridRowStart extends Style {
    static override key = dash(GRID, ROW, START);
    static override unit = '';
}