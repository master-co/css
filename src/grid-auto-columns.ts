import { AUTO, COLUMNS, CONTENT, DASH, GRID, MAX, MIN } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoColumnsStyle extends Style {
    static override matches = /^grid-auto-cols:./;
    static override key = GRID + DASH + AUTO + DASH + COLUMNS;
    static override values = {
        'min': MIN + DASH + CONTENT,
        'max': MAX + DASH + CONTENT
    };
}