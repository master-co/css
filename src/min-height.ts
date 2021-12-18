import { DASH, FIT_CONTENT, H_PREFIX, MAX_CONTENT, MIN, MIN_CONTENT, MIN_HEIGHT, PERCENT100 } from './constants/css-property-keyword';
import { Style } from '@master/style';

const MIN_HEIGHT_PREFIX = MIN + DASH + H_PREFIX;

export class MinHeightStyle extends Style {
    static override prefixes = /^min-h(eight)?:/;
    static override property = MIN_HEIGHT;
    static override supportFullName = false;
    static override values = {
        full: PERCENT100,
        fit: FIT_CONTENT,
        max: MAX_CONTENT,
        min: MIN_CONTENT
    }
}