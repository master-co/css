import { COLUMNS, CONTENT, dash, GRID, MAX, MIN, TEMPLATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridTemplateColumns extends Style {
    static override matches = /^grid-template-cols:./;
    static override key = dash(GRID, TEMPLATE, COLUMNS);
    static override values = {
        'min': dash(MIN, CONTENT),
        'max': dash(MAX, CONTENT)
    };
}