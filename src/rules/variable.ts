import { MasterCSSRule } from '../rule';

export class Variable extends MasterCSSRule {
    static id = 'variable';
    static override matches = /^\$.+:./;
    static override unit = ''; // don't use 'rem' as default, because css variable is common API
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            ['--' + this.prefix.slice(1, -1)]: propertyInfo
        }
    }
}