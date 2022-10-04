import { COLUMN, dash, DIRECTION, FLEX, REVERSE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FlexDirection extends MasterCSSRule {
    static override matches = /^flex:((row|col|column)(-reverse)?)(?!\|)/;
    static override key = dash(FLEX, DIRECTION);
}