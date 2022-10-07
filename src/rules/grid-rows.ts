import { ROWS, DISPLAY, FR, GRID, MAX, MIN, REPEAT, TEMPLATE, COMMA, AUTO, FLOW, COLUMN, dash } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridRows extends MasterCSSRule {
    static override key = dash(GRID, ROWS);
    static override unit = '';
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            [DISPLAY]: { ...propertyInfo, value: GRID },
            [dash(GRID, AUTO, FLOW)]: { ...propertyInfo, value: COLUMN },
            [dash(GRID, TEMPLATE, ROWS)]: {
                ...propertyInfo,
                value: REPEAT
                    + '(' + propertyInfo.value
                    + COMMA
                    + MIN + MAX
                    + '(' + 0 + COMMA + 1 + FR + '))'
            },
        };
    }
}