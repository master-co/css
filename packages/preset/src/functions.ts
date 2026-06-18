import type { MasterCSSPlanFunctions } from 'shared/master-css-plan'

const functions = {
    "translate": {},
    "translateX": {},
    "translateY": {},
    "translateZ": {},
    "translate3d": {},
    "perspective": {},
    "skew": {},
    "skewX": {},
    "skewY": {},
    "skewZ": {},
    "skew3d": {},
    "rotate": {},
    "rotateX": {},
    "rotateY": {},
    "rotateZ": {},
    "rotate3d": {},
    "blur": {},
    "drop-shadow": {},
    "hue-rotate": {},
    "rgb": {},
    "rgba": {},
    "hsl": {},
    "hsla": {},
    "color": {},
    "color-contrast": {},
    "color-mix": {},
    "hwb": {},
    "lab": {},
    "lch": {},
    "oklab": {},
    "oklch": {},
    "light-dark": {},
    "clamp": {
        "op": "core.math",
        "options": {
            "name": "clamp",
            "wrapArguments": true
        }
    },
    "repeat": {},
    "linear-gradient": {},
    "radial-gradient": {},
    "conic-gradient": {},
    "repeating-linear-gradient": {},
    "repeating-radial-gradient": {},
    "repeating-conic-gradient": {},
    "matrix": {},
    "matrix3d": {},
    "scale": {},
    "scale3d": {},
    "scaleX": {},
    "scaleY": {},
    "scaleZ": {},
    "$": {
        "op": "core.variable"
    },
    "calc": {
        "op": "core.math"
    }
} satisfies MasterCSSPlanFunctions

export default functions
