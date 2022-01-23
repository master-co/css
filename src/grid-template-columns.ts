import { COLUMNS, CONTENT, DASH, GRID, MAX, MIN, TEMPLATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridTemplateColumnsStyle extends Style {
    static override matches = /^grid-template-cols:./;
    static override key = GRID + DASH + TEMPLATE + DASH + COLUMNS;
    static override values = {
        'min': MIN + DASH + CONTENT,
        'max': MAX + DASH + CONTENT
    };
}