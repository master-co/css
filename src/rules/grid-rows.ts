import { ROWS, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE, COMMA, AUTO, FLOW, COLUMN, dash } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridRows extends MasterCSSRule {
    static override key = dash(GRID, ROWS);
    static override unit = '';
    override get props(): { [key: string]: any } {
        return {
            [DISPLAY]: { ...this, value: GRID },
            [dash(GRID, AUTO, FLOW)]: { ...this, value: COLUMN },
            [dash(GRID, TEMPLATE, ROWS)]: {
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