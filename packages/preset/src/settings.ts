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

export const variableNamespaceRefs = [
    "=font",
    "=font-family",
    "=tracking",
    "=leading",
    "=font-weight",
    "=font-size",
    "=radius",
    "=spacing",
    "=breakpoint",
    "=container",
    "=duration",
    "=easing",
    "=animation",
    "=color",
    "=shadow",
    "=color-line",
    "=color-text",
    "=order",
    "~font-family",
    "~font-weight",
    "~font-size",
    "~color-text",
    "~color",
    "~spacing",
    "~container",
    "~tracking",
    "~leading",
    "~shadow",
    "~easing",
    "~duration",
    "~color-line",
    "~radius"
] as const
