import { ISOLATE, ISOLATION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Isolation extends MasterCSSRule {
    static override key = ISOLATION;
}