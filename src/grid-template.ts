import { DASH, GRID, TEMPLATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridTemplateStyle extends Style {
    static override key = GRID + DASH + TEMPLATE;
}