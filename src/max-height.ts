import { FIT_CONTENT, MAX_CONTENT, MAX_HEIGHT, MIN_CONTENT, PERCENT100 } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class MaxHeightStyle extends Style {
    static override prefixes = /^max-h(eight)?:/;
    static override properties = [MAX_HEIGHT];
    static override supportFullName = false;
    static override values = {
        full: PERCENT100,
        fit: FIT_CONTENT,
        max: MAX_CONTENT,
        min: MIN_CONTENT
    }
}