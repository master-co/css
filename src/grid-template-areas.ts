import { AREA, dash, GRID, TEMPLATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridTemplateAreas extends Style {
    static override key = dash(GRID, TEMPLATE, AREA) + 's';
}