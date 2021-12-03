import { ROWS, DASH, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE, COMMA, AUTO, FLOW, COLUMN } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterGridRowsVirtualClass extends MasterVirtualClass {
    static override prefixes = /^rows:/;
    static override defaultUnit = '';
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