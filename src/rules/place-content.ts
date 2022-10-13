import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'PlaceContent'
    static override propName = 'place-content'
    override order = -1;
}