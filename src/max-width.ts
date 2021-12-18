import { MAX_WIDTH, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class MaxWidthStyle extends Style {
    static override prefixes = /^max-w:/;
    static override property = MAX_WIDTH;
    static override values = SIZING_VALUES;
}