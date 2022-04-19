import { COLUMNS, COMMA, dash, DASH, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridColumns extends Style {
    static override matches = /^grid-cols:./;
    static override key = dash(GRID, COLUMNS);
    static override unit = '';
    override get props(): { [key: string]: any } {
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