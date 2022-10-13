import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'JustifyContent'
    static override matches =  /^jc:./;
    static override propName = 'justify-content';

}