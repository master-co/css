import { COLUMN, dash, GRID, SPAN } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridColumn extends MasterCSSRule {
    static override matches = /^grid-col(?:umn)?(?:-span)?:./;
    static override key = dash(GRID, COLUMN);
    static override unit = '';
    override get parseValue() {
        return this.prefix.slice(-5, -1) === 'span' && this.value !== 'auto'
            ? SPAN + ' ' + this.value + '/' + SPAN + ' ' + this.value
            : this.value;
    }
    override order = -1;
}