import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'PlaceSelf'
    static override propName = 'place-self'
    override order = -1;
}