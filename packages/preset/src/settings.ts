import type { MasterCSSPlanSettings } from 'shared/master-css-plan'

export const settings = {
    "rootSize": 16,
    "baseUnit": 4,
    "defaultMode": "light",
    "modeTrigger": "media",
    "modes": [
        "light",
        "dark"
    ]
} satisfies MasterCSSPlanSettings
