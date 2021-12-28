import { MIN_HEIGHT, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class MinHeightStyle extends Style {
    static override matches = /^min-h:./;
    static override key = MIN_HEIGHT;
    static override values = SIZING_VALUES;
}