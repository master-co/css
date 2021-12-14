import { AUTO, DASH, GRID, ROW, SPAN } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class GridRowStyle extends MasterStyle {
    static override prefixes = /^grid-row(-span)?:/;
    static override defaultUnit = '';
    static override semantics = {
        [GRID + DASH + ROW + DASH + AUTO]: AUTO
    }
    override get properties(): { [key: string]: any } {
        return {
            [GRID + DASH + ROW]: {
                ...this,
                value: this.prefix.slice(-5, -1) === 'span'
                    ? SPAN + ' ' + this.value + '/' + SPAN + ' ' + this.value
                    : this.value
            }
        };
    }
}