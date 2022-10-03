import { HIDDEN, INVISIBLE, VISIBILITY, VISIBLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Visibility extends MasterCSSRule {
    static override key = VISIBILITY;
    static override semantics = {
        visible: VISIBLE,
        invisible: HIDDEN
    }
}