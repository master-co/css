import { TRANSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Transition'
    static override symbol = '~'; 
    static override propName = TRANSITION;
    override order = -1;
}