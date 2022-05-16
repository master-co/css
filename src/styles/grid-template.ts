import { dash, GRID, TEMPLATE } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class GridTemplate extends Style {
    static override key = dash(GRID, TEMPLATE);
    override order = -1;
}