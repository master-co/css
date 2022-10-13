import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Fill'
    static override propName = 'fill';
    static override colorStarts = 'fill:';
    static override colorful = true;
}