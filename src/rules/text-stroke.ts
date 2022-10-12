import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextStroke'
    static override matches = /^text-stroke:./;
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke': declaration
        };
    }
}