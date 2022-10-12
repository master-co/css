import { MasterCSSRule } from '../rule';
import { COLUMNS } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'Columns'
    static override matches = /^(columns|cols):./;
    static override propName = COLUMNS;
    static override unit = '';
    override order = -1;
}