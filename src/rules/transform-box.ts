import Rule from '../rule'

export default class extends Rule {
    static override id = 'TransformBox'
    static override matches = /^transform:(content|border|fill|stroke|view)(?!\|)/
}