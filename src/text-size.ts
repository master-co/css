import { REM } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextSize extends Style {
    static override matches = /^t(ext)?:([0-9]|(max|min|calc|clamp)\(.*\))((?!;).)*$/;
    override get props(): { [key: string]: any } {
        return {
            'font-size': this,
            'line-height': {
                ...this,
                value: this.unit === REM
                    ? this.value + .375 + this.unit
                    : 'calc(' + this.value + this.unit + ' + .375rem)',
                unit: ''
            }
        };
    }
}