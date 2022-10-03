import { dash, FLEX, WRAP } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FlexWrap extends MasterCSSRule {
    static override matches = /^flex:(wrap(-reverse)?|nowrap)(?!\|)/;
    static override key = dash(FLEX, WRAP);
}