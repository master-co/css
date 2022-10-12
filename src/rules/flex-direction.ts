import { COLUMN, dash, DIRECTION, FLEX, REVERSE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FlexDirection'
    static override matches = /^flex:((row|col|column)(-reverse)?)(?!\|)/;
    static override propName = dash(FLEX, DIRECTION);
}