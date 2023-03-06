import { RuleConfig } from '..'

export const scrollSnapStop: RuleConfig = {
    matches: '^scroll-snap:(?:normal|always|$values)(?!\\|)'
}