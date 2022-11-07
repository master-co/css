import Rule from '../rule'

export default class extends Rule {
    static override id = 'FlexWrap'
    static override matches = /^flex:(wrap(-reverse)?|nowrap)(?!\|)/
}