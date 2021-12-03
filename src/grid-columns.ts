import { COLUMNS, COMMA, DASH, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterGridColumnsVirtualClass extends MasterVirtualClass {
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