import { ALIGN, dash, ITEMS } from '../constants/css-property-keyword';
import { Style } from '../style';

export class AlignItems extends Style {
    static override matches =  /^ai:./;
    static override key = dash(ALIGN, ITEMS);
}