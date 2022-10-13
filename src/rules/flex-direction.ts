import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FlexDirection'
    static override matches = /^flex:((row|col|column)(-reverse)?)(?!\|)/;
    static override propName = 'flex-direction';
}