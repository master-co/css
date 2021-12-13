import { COLUMNS, COMMA, DASH, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class GridColumnsStyle extends MasterStyle {
    static override prefixes = /^cols:/;
    static override defaultUnit = '';
    override get properties(): { [key: string]: any } {
        return {
            [DISPLAY]: { ...this, value: GRID },
            [GRID + DASH + TEMPLATE + DASH + COLUMNS]: {
                ...this,
                value: REPEAT
                    + '(' + this.value
                    + COMMA
                    + MIN + MAX
                    + '(' + 0 + COMMA + 1 + FR + '))'
            },
        };
    }
}