import { SyntaxRule } from '../syntax-rule'
import { ValueComponent } from './syntax'

export declare type SyntaxRuleDeclare = (this: SyntaxRule, value: string, valueComponents: ValueComponent[], data: any) => Record<string, any>