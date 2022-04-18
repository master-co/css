import { BASIS, DASH, FLEX, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexBasis extends Style {
    static override key = FLEX + DASH + BASIS;
    static override values = SIZING_VALUES;
}