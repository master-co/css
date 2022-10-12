import { ROWS, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE, COMMA, AUTO, FLOW, COLUMN, dash } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridRows'
    static override propName = dash(GRID, ROWS);
    static override unit = '';
    override get(declaration): { [key: string]: any } {
        return {
            [DISPLAY]: { ...declaration, value: GRID },
            [dash(GRID, AUTO, FLOW)]: { ...declaration, value: COLUMN },
            [dash(GRID, TEMPLATE, ROWS)]: {
                ...declaration,
                value: REPEAT
                    + '(' + declaration.value
                    + COMMA
                    + MIN + MAX
                    + '(' + 0 + COMMA + 1 + FR + '))'
            },
        };
    }
}