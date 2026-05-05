import utilities from '../config/utilities'
import UtilityType from '../utility-type'

export default function isCoreRule(id: string) {
    return utilities.some((utility) => (utility.type === UtilityType.Static ? '.' + utility.name : utility.name) === id)
}
