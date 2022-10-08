import { dash, GRID, ROW, SPAN } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridRow extends MasterCSSRule {
    static override matches = /^grid-row-span:./;
    static override propName = dash(GRID, ROW);
    static override unit = '';
    override parseValue(value: string): string {
        return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
            ? SPAN + ' ' + value + '/' + SPAN + ' ' + value
            : value;
    }
    override order = -1;
}