import { ANIMATION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Animation'
    static override symbol = '@'; 
    static override propName = ANIMATION;
    static override unit = '';
    override order = -1;
}