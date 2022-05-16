import { GRID } from '../constants/css-property-keyword';
import { Style } from '../style';

export class Grid extends Style {
    static override key = GRID;
    override order = -1;
}