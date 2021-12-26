import { FIT_CONTENT, MAX_CONTENT, MAX_HEIGHT, MIN_CONTENT, PERCENT100, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class MaxHeightStyle extends Style {
    static override matches = /^max-h:./;
    static override key = MAX_HEIGHT;
    static override values = SIZING_VALUES;
}