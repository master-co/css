import { HIDDEN, INVISIBLE, VISIBILITY, VISIBLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Visibility'
    static override propName = VISIBILITY;
}