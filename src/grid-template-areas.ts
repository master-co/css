import { AREA, DASH, GRID, TEMPLATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridTemplateAreas extends Style {
    static override key = GRID + DASH + TEMPLATE + DASH + AREA + 's';
}