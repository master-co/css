import { DASH, GRID, TEMPLATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridTemplateAreasStyle extends Style {
    static override key = GRID + DASH + TEMPLATE + DASH + 'areas';
}