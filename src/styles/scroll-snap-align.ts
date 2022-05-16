import { Style } from '../style';
import { ALIGN, dash, SCROLL, SNAP } from '../constants/css-property-keyword';

export class ScrollSnapAlign extends Style {
    static override matches = /^scroll-snap:(start|end|center)/
    static override key = dash(SCROLL, SNAP, ALIGN);
}