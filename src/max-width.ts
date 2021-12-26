import { MAX_WIDTH, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class MaxWidthStyle extends Style {
    static override matches = /^max-w:./;
    static override key = MAX_WIDTH;
    static override values = SIZING_VALUES;
}