import { ROWS, DASH, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE, COMMA, AUTO, FLOW, COLUMN } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridRowsStyle extends Style {
    static override prefixes = /^grid-rows:/;
    static override defaultUnit = '';
    static override supportFullName = false;
    override get properties(): { [key: string]: any } {
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