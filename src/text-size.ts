import { DASH, EM, FONT, HEIGHT, LINE, REM, SIZE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTextSizeVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(t:[0-9])/;
    override get properties(): { [key: string]: any } {
        return {
            [FONT + DASH + SIZE]: this,
            [LINE + DASH + HEIGHT]: {
                ...this,
                value: this.unit === REM
                    ? this.value + .375 + this.unit
                    : 'calc(' + this.value + this.unit + ' + .375rem)',
                unit: ''
            }
        };
    }
}