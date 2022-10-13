import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'OutlineColor'
    static override propName = 'outline-color'
    static override colorStarts = 'outline:';
    static override colorful = true;
}