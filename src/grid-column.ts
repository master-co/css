import { AUTO, COL, COLUMN, DASH, GRID, SPAN } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const GRID_COLUMN = GRID + DASH + COLUMN;

export class GridColumnStyle extends MasterStyle {
    static override prefixes = /^grid-(col-span|column):/;
    static override defaultUnit = '';
    static override semantics = {
        [GRID + DASH + COL + DASH + AUTO]: AUTO
    }
    override get properties(): { [key: string]: any } {
        return {
            [GRID_COLUMN]: {
                ...this,
                value: this.prefix.startsWith(GRID_COLUMN) 
                    ? this.value
                    : SPAN + ' ' + this.value + '/' + SPAN + ' ' + this.value
            }
        };
    }
}