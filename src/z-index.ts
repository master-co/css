import { Z_INDEX } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class ZIndexStyle extends MasterStyle {
    static override prefixes = /^(z-index|z):/;
    static override properties = [Z_INDEX];
    static override defaultUnit = '';
}