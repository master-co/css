import { dash, FLEX, SHRINK } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexShrink extends Style {
    static override key = dash(FLEX, SHRINK);
    static override unit = '';
}