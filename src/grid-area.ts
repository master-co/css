import { AREA, DASH, GRID } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAreaStyle extends Style {
    static override key = GRID + DASH + AREA;
    static override unit = '';
    override get getOrder(): number {
        return -1;
    }
}