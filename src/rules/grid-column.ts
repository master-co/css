import { COLUMN, dash, GRID, SPAN } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridColumn extends MasterCSSRule {
    static override matches = /^grid-col(?:umn)?(?:-span)?:./;
    static override key = dash(GRID, COLUMN);
    static override unit = '';
    override parseValue(value: string): string {
        return this.prefix.slice(-5, -1) === 'span' && value !== 'auto'
            ? SPAN + ' ' + value + '/' + SPAN + ' ' + value
            : value;
    }
    override order = -1;
}