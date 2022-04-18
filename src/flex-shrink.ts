import { DASH, FLEX, SHRINK } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexShrink extends Style {
    static override key = FLEX + DASH + SHRINK;
    static override unit = '';
}