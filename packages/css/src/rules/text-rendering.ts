import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TextRendering'
    static override matches = /^t(ext)?:(optimizeSpeed|optimizeLegibility|geometricPrecision)(?!\|)/
    static override propName = 'text-rendering'
}