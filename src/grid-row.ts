import { DASH, GRID, ROW, SPAN } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridRowStyle extends Style {
    static override matches = /^grid-row(-span)?:./;
    static override key = GRID + DASH + ROW;
    static override unit = '';
    override get parseValue() {
        return this.prefix.slice(-5, -1) === 'span' && this.value !== 'auto'
            ? SPAN + ' ' + this.value + '/' + SPAN + ' ' + this.value
            : this.value;
    }
}