import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ObjectFit'
    static override matches = /^(object|obj):(contain|cover|fill|scale-down)/
    static override propName = 'object-fit'
}