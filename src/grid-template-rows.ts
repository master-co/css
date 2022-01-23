import { CONTENT, DASH, GRID, MAX, MIN, ROWS, TEMPLATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridTemplateRowsStyle extends Style {
    static override key = GRID + DASH + TEMPLATE + DASH + ROWS;
    static override values = {
        'min': MIN + DASH + CONTENT,
        'max': MAX + DASH + CONTENT
    };
}