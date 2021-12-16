import { Z_INDEX } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ZIndexStyle extends Style {
    static override prefixes = /^z:/;
    static override properties = [Z_INDEX];
    static override defaultUnit = '';
}