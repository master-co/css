import { AUTO, dash, FLOW, GRID } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridAutoFlow'
    static override matches = /^grid-flow:./;
    static override propName = dash(GRID, AUTO, FLOW);
}