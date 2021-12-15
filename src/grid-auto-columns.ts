import { AUTO, COLUMNS, DASH, GRID } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class GridAutoColumnsStyle extends MasterStyle {
    static override prefixes = /^grid-auto-(columns|cols):/;
    static override supportFullName = false;
    static override properties = [GRID + DASH + AUTO + DASH + COLUMNS];
}