import { dash, FLEX, WRAP } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FlexWrap'
    static override matches = /^flex:(wrap(-reverse)?|nowrap)(?!\|)/;
    static override propName = dash(FLEX, WRAP);
}