import { Style } from '@master/style';
import { BORDER, COLLAPSE, DASH } from './constants/css-property-keyword';

export class BorderCollapseStyle extends Style {
    static override matches = /^b-collapse:.|b(order)?:(collapse|separate)(?!;)/;
    static override key = BORDER + DASH + COLLAPSE;
}