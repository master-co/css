import { ROWS, DASH, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE, COMMA, AUTO, FLOW, COLUMN } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridRows extends Style {
    static id = 'gridRows';
    static override matches = /^grid-rows:./;
    static override unit = '';
    override get props(): { [key: string]: any } {
        return {
            [DISPLAY]: { ...this, value: GRID },
            [GRID + DASH + AUTO + DASH + FLOW]: { ...this, value: COLUMN },
            [GRID + DASH + TEMPLATE + DASH + ROWS]: {
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