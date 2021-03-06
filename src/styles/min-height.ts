import { MIN_HEIGHT, SIZING_VALUES } from '../constants/css-property-keyword';
import { Style } from '../style';

export class MinHeight extends Style {
    static override matches = /^min-h:./;
    static override key = MIN_HEIGHT;
    static override values = SIZING_VALUES;
}