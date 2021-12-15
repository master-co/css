import { DASH, FLEX, WRAP } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FlexWrapStyle extends MasterStyle {
    static override prefixes = /^flex:(wrap(-reverse)?|nowrap)/;
    static override properties = [FLEX + DASH + WRAP];
}