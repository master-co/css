import { AUTO, DASH, GRID, ROW, SPAN } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class GridRowStyle extends MasterStyle {
    static override prefixes = /^grid-row-span:/;
    static override properties = [GRID + DASH + ROW];
    static override defaultUnit = '';
    static override semantics = {
        [GRID + DASH + ROW + DASH + AUTO]: AUTO
    }
    override get parseValue() {
        return this.prefix.slice(-5, -1) === 'span'
            ? SPAN + ' ' + this.value + '/' + SPAN + ' ' + this.value
            : this.value
    }
}