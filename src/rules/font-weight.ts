import { dash, FONT, WEIGHT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FontWeight'
    static override matches = /^f(ont)?:(thin|extralight|light|regular|medium|semibold|bold|bolder|extrabold|heavy)(?!\|)/;
    static override propName = dash(FONT, WEIGHT);
    static override unit = '';
}