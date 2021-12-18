import { Style } from '@master/style';
import { BORDER, COLLAPSE, DASH } from './constants/css-property-keyword';

export class BorderCollapseStyle extends Style {
    static override prefixes = /^b(order)?-collapse:/;
    static override property = BORDER + DASH + COLLAPSE;
    static override supportFullName = false;
}