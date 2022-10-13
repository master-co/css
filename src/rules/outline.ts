import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Outline'
    static override propName = 'outline'
    override order = -1;
    static override colorful = true;
}