import UtilityType from 'shared/utility-type'
import type { MasterCSSPlanUtility } from 'shared/master-css-plan'

export type PresetUtilitySource = Omit<MasterCSSPlanUtility, 'order'>

const utilities = [
    {
        "id": "group",
        "name": "group",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "group"
        },
        "matchers": [
            {
                "type": "group"
            }
        ]
    },

] satisfies PresetUtilitySource[]

export default utilities
