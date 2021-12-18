import { BASIS, DASH, FLEX, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexBasisStyle extends Style {
    static override property = FLEX + DASH + BASIS;
    static override values = SIZING_VALUES;
}