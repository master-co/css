import { DASH, FLEX, GROW } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexGrowStyle extends Style {
    static override property = FLEX + DASH + GROW;
}