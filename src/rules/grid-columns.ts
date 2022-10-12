import { COLUMNS, COMMA, dash, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridColumns'
    static override matches = /^grid-cols:./;
    static override propName = dash(GRID, COLUMNS);
    static override unit = '';
    override get(declaration): { [key: string]: any } {
        return {
            [DISPLAY]: { ...declaration, value: GRID },
            [dash(GRID, TEMPLATE, COLUMNS)]: {
                ...this,
                value: REPEAT
                    + '(' + declaration.value
                    + COMMA
                    + MIN + MAX
                    + '(' + 0 + COMMA + 1 + FR + '))'
            },
        };
    }
}