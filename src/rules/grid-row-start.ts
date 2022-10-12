import { dash, GRID, ROW, START } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridRowStart'
    static override propName = dash(GRID, ROW, START);
    static override unit = '';
}