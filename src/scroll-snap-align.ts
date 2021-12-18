import { Style } from '@master/style';
import { ALIGN, DASH, SCROLL, SNAP } from './constants/css-property-keyword';

export class ScrollSnapAlignStyle extends Style {
    static override property = SCROLL + DASH + SNAP + DASH + ALIGN;
}