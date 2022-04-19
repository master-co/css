import { AUTO, COLUMNS, CONTENT, dash, GRID, MAX, MIN } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoColumns extends Style {
    static override matches = /^grid-auto-cols:./;
    static override key = dash(GRID, AUTO, COLUMNS);
    static override values = {
        'min': dash(MIN, CONTENT),
        'max': dash(MAX, CONTENT)
    };
}