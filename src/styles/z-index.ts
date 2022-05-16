import { Z_INDEX } from '../constants/css-property-keyword';
import { Style } from '../style';

export class ZIndex extends Style {
    static override matches = /^z:./;
    static override key = Z_INDEX;
    static override unit = '';
}