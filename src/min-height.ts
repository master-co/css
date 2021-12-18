import { DASH, FIT_CONTENT, H_PREFIX, MAX_CONTENT, MIN, MIN_CONTENT, MIN_HEIGHT, PERCENT100, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

const MIN_HEIGHT_PREFIX = MIN + DASH + H_PREFIX;

export class MinHeightStyle extends Style {
    static override prefixes = /^min-h:/;
    static override key = MIN_HEIGHT;
    static override values = SIZING_VALUES;
}