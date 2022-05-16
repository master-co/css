import { MAX_HEIGHT, SIZING_VALUES } from '../constants/css-property-keyword';
import { Style } from '../style';

export class MaxHeight extends Style {
    static override matches = /^max-h:./;
    static override key = MAX_HEIGHT;
    static override values = SIZING_VALUES;
}