import { MasterStyle } from '@master/style';
import { BORDER, COLLAPSE, DASH } from './constants/css-property-keyword';

export class BorderCollapseStyle extends MasterStyle {
    static override prefixes = /^b(order)?-collapse:/;
    static override properties = [BORDER + DASH + COLLAPSE];
    static override supportFullName = false;
}