import { OPACITY } from '../constants/css-property-keyword';
import { Style } from '../style';

export class Opacity extends Style {
    static override key = OPACITY;
    static override unit = '';
}