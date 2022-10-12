import { dash, END, GRID, ROW } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridRowEnd'
    static override propName = dash(GRID, ROW, END);
    static override unit = '';
}