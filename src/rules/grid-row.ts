import { dash, GRID, ROW, SPAN } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridRow extends MasterCSSRule {
    static override matches = /^grid-row-span:./;
    static override key = dash(GRID, ROW);
    static override unit = '';
    override get parseValue() {
        return this.prefix.slice(-5, -1) === 'span' && this.value !== 'auto'
            ? SPAN + ' ' + this.value + '/' + SPAN + ' ' + this.value
            : this.value;
    }
    override order = -1;
}