import { RuleConfig } from '../rule'

export const scrollSnapStop: RuleConfig = {
    matches: '^scroll-snap:(?:normal|always|$values)(?!\\|)'
}