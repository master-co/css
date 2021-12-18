import { AUTO, COLUMNS, DASH, GRID } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoColumnsStyle extends Style {
    static override prefixes = /^grid-auto-(columns|cols):/;
    static override property = GRID + DASH + AUTO + DASH + COLUMNS;
}