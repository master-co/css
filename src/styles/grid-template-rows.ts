import { CONTENT, dash, GRID, MAX, MIN, ROWS, TEMPLATE } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class GridTemplateRows extends Style {
    static override key = dash(GRID, TEMPLATE, ROWS);
    static override values = {
        'min': dash(MIN, CONTENT),
        'max': dash(MAX, CONTENT)
    };
}