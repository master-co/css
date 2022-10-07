import { WIDTH } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Width extends MasterCSSRule {
    static override matches = /^w:./;
    static override key = WIDTH;
}