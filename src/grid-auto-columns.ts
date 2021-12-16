import { AUTO, COLUMNS, DASH, GRID } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoColumnsStyle extends Style {
    static override prefixes = /^grid-auto-(columns|cols):/;
    static override supportFullName = false;
    static override properties = [GRID + DASH + AUTO + DASH + COLUMNS];
}