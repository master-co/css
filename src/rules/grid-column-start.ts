import { COLUMN, dash, GRID, START } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridColumnStart'
    static override matches = /^grid-col-start:./;
    static override propName = dash(GRID, COLUMN, START);
    static override unit = '';
}