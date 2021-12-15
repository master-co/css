import { AUTO, DASH, GRID, ROWS } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class GridAutoRowsStyle extends MasterStyle {
    static override prefixes = /^grid-auto-rows:/;
    static override properties = [GRID + DASH + AUTO + DASH + ROWS];

}