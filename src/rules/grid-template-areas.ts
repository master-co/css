import { AREA, dash, GRID, TEMPLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridTemplateAreas extends MasterCSSRule {
    static override key = dash(GRID, TEMPLATE, AREA) + 's';
}