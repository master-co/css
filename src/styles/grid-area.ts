import { AREA, dash, GRID } from '../constants/css-property-keyword';
import { Style } from '../style';

export class GridArea extends Style {
    static override key = dash(GRID, AREA);
    static override unit = '';
    override order = -1;
}