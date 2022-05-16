import { COLUMN, dash, GRID, SPAN } from '../constants/css-property-keyword';
import { Style } from '../style';

export class GridColumn extends Style {
    static override matches = /^grid-col(-span)?:./;
    static override key = dash(GRID, COLUMN);
    static override unit = '';
    override get parseValue() {
        return this.prefix.slice(-5, -1) === 'span' && this.value !== 'auto'
            ? SPAN + ' ' + this.value + '/' + SPAN + ' ' + this.value
            : this.value;
    }
    override order = -1;
}