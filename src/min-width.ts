import { DASH, MIN, MIN_WIDTH, SIZING_VALUES, W_PREFIX } from './constants/css-property-keyword';
import { Style } from '@master/style';

const MIN_W_PREFIX = MIN + DASH + W_PREFIX;

export class MinWidthStyle extends Style {
    static override matches = /^min-w:./;
    static override key = MIN_WIDTH;
    static override values = SIZING_VALUES;
}