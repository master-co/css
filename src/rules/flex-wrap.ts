import Rule from '../rule'

export default class extends Rule {
    static override id: 'FlexWrap' = 'FlexWrap' as const
    static override matches = /^flex:(wrap(-reverse)?|nowrap)(?!\|)/
}