import type { MasterCSSPlanFunctions } from 'shared/master-css-plan'

const functions = {
    "translate": {
        "unit": "rem"
    },
    "translateX": {
        "unit": "rem"
    },
    "translateY": {
        "unit": "rem"
    },
    "translateZ": {
        "unit": "rem"
    },
    "translate3d": {
        "unit": "rem"
    },
    "perspective": {
        "unit": "rem"
    },
    "skew": {
        "unit": "deg"
    },
    "skewX": {
        "unit": "deg"
    },
    "skewY": {
        "unit": "deg"
    },
    "skewZ": {
        "unit": "deg"
    },
    "skew3d": {
        "unit": "deg"
    },
    "rotate": {
        "unit": "deg"
    },
    "rotateX": {
        "unit": "deg"
    },
    "rotateY": {
        "unit": "deg"
    },
    "rotateZ": {
        "unit": "deg"
    },
    "rotate3d": {
        "unit": "deg"
    },
    "blur": {
        "unit": "rem"
    },
    "drop-shadow": {
        "unit": "rem"
    },
    "hue-rotate": {
        "unit": "deg"
    },
    "rgb": {
        "unit": ""
    },
    "rgba": {
        "unit": ""
    },
    "hsl": {
        "unit": ""
    },
    "hsla": {
        "unit": ""
    },
    "color": {
        "unit": ""
    },
    "color-contrast": {
        "unit": ""
    },
    "color-mix": {
        "unit": ""
    },
    "hwb": {
        "unit": ""
    },
    "lab": {
        "unit": ""
    },
    "lch": {
        "unit": ""
    },
    "oklab": {
        "unit": ""
    },
    "oklch": {
        "unit": ""
    },
    "light-dark": {
        "unit": ""
    },
    "clamp": {
        "op": "core.math",
        "options": {
            "name": "clamp",
            "wrapArguments": true
        }
    },
    "repeat": {
        "unit": ""
    },
    "linear-gradient": {},
    "radial-gradient": {},
    "conic-gradient": {},
    "repeating-linear-gradient": {},
    "repeating-radial-gradient": {},
    "repeating-conic-gradient": {},
    "matrix": {
        "unit": ""
    },
    "matrix3d": {
        "unit": ""
    },
    "scale": {
        "unit": ""
    },
    "scale3d": {
        "unit": ""
    },
    "scaleX": {
        "unit": ""
    },
    "scaleY": {
        "unit": ""
    },
    "scaleZ": {
        "unit": ""
    },
    "$": {
        "op": "core.variable"
    },
    "calc": {
        "op": "core.math"
    }
} satisfies MasterCSSPlanFunctions

export default functions
