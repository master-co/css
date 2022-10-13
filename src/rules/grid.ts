import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Grid'
    static override propName = 'grid'
    override order = -1;
}