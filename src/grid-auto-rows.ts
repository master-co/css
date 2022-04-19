import { AUTO, CONTENT, dash, GRID, MAX, MIN, ROWS } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoRows extends Style {
    static override key = dash(GRID, AUTO, ROWS);
    static override values = {
        'min': dash(MIN, CONTENT),
        'max': dash(MAX, CONTENT)
    };
}