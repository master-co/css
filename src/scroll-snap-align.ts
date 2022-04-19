import { Style } from '@master/style';
import { ALIGN, DASH, SCROLL, SNAP } from './constants/css-property-keyword';

export class ScrollSnapAlign extends Style {
    static override matches = /^scroll-snap:(start|end|center)/
    static override key = SCROLL + DASH + SNAP + DASH + ALIGN;
}