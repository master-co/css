import { DASH, FLEX, SHRINK } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexShrinkStyle extends Style {
    static override properties = [FLEX + DASH + SHRINK];
}