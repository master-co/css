import { dash, GRID, ROW, SPAN } from '../constants/css-property-keyword';
import { Style } from '../style';

export class GridRow extends Style {
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