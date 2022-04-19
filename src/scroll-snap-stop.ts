import { Style } from '@master/style';
import { dash, SCROLL, SNAP, STOP } from './constants/css-property-keyword';

export class ScrollSnapStop extends Style {
    static override matches = /^scroll-snap:(normal|always)(?!;)/
    static override key = dash(SCROLL, SNAP, STOP);
}