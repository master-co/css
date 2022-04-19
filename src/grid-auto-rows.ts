import { AUTO, CONTENT, DASH, GRID, MAX, MIN, ROWS } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoRows extends Style {
    static override key = GRID + DASH + AUTO + DASH + ROWS;
    static override values = {
        'min': MIN + DASH + CONTENT,
        'max': MAX + DASH + CONTENT
    };
}