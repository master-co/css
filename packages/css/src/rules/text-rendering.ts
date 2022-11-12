import Rule from '../rule'

export default class extends Rule {
    static override id: 'TextRendering' = 'TextRendering' as const
    static override matches = /^t(ext)?:(optimizeSpeed|optimizeLegibility|geometricPrecision)(?!\|)/
}