import { BASIS, DASH, FLEX, FULL, PERCENT100 } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexBasisStyle extends Style {
    static override properties = [FLEX + DASH + BASIS];
    static override values = { [FULL]: PERCENT100 };
}