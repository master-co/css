import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextDecorationColor'
    static override propName = 'text-decoration-color'
    static override colorStarts = 'text-decoration:';
    static override colorful = true;
}