import { Style } from '@master/style';
import { DASH, SCROLL, SNAP, TYPE } from './constants/css-property-keyword';

export class ScrollSnapTypeStyle extends Style {
    static override properties = [SCROLL + DASH + SNAP + DASH + TYPE];
}