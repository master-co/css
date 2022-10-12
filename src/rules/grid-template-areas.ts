import { AREA, dash, GRID, TEMPLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridTemplateAreas'
    static override propName = dash(GRID, TEMPLATE, AREA) + 's';
}