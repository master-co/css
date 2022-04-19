import { BEHAVIOR, dash, SCROLL } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ScrollBehavior extends Style {
    static override key = dash(SCROLL, BEHAVIOR);
}