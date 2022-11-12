import Rule from '../rule'

export default class extends Rule {
    static override id: 'TransformBox' = 'TransformBox' as const
    static override matches = /^transform:(content|border|fill|stroke|view)(?!\|)/
}