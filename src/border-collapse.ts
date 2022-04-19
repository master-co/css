import { Style } from '@master/style';
import { BORDER, COLLAPSE, dash } from './constants/css-property-keyword';

export class BorderCollapse extends Style {
    static override matches = /^b(order)?:(collapse|separate)(?!;)/;
    static override key = dash(BORDER, COLLAPSE);
}