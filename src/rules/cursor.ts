import { MasterCSSRule } from '../rule';
import { CURSOR } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'Cursor'
    static override propName = CURSOR;
}