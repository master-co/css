import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'AlignContent'
    static override matches = /^ac:./
    static override propName = 'align-content'
}