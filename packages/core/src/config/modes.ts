/* eslint-disable quotes */
import { ModeDefinitions } from '../types/config'

const modes = {
    "light": {
        "color": {
            "ground": "$color-grey-0",
            "base": "$color-white",
            "invert": "$color-black",
            "stone": {
                "": "$color-stone-30",
                "active": "$color-stone-40",
                "text": "$color-stone-90"
            },
            "gray": {
                "": "$color-gray-30",
                "active": "$color-gray-40",
                "text": "$color-gray-90"
            },
            "grey": {
                "": "$color-grey-30",
                "active": "$color-grey-40",
                "text": "$color-grey-90"
            },
            "slate": {
                "": "$color-slate-30",
                "active": "$color-slate-40",
                "text": "$color-slate-90"
            },
            "brown": {
                "": "$color-brown-40",
                "active": "$color-brown-50",
                "text": "$color-brown-90"
            },
            "orange": {
                "": "$color-orange-40",
                "active": "$color-orange-50",
                "text": "$color-orange-90"
            },
            "amber": {
                "": "$color-amber-40",
                "active": "$color-amber-50",
                "text": "$color-amber-90"
            },
            "yellow": {
                "": "$color-yellow-40",
                "active": "$color-yellow-50",
                "text": "$color-yellow-90"
            },
            "lime": {
                "": "$color-lime-40",
                "active": "$color-lime-50",
                "text": "$color-lime-90"
            },
            "green": {
                "": "$color-green-40",
                "active": "$color-green-50",
                "text": "$color-green-90"
            },
            "beryl": {
                "": "$color-beryl-40",
                "active": "$color-beryl-50",
                "text": "$color-beryl-90"
            },
            "teal": {
                "": "$color-teal-40",
                "active": "$color-teal-50",
                "text": "$color-teal-90"
            },
            "cyan": {
                "": "$color-cyan-40",
                "active": "$color-cyan-50",
                "text": "$color-cyan-90"
            },
            "sky": {
                "": "$color-sky-60",
                "active": "$color-sky-70",
                "text": "$color-white"
            },
            "blue": {
                "": "$color-blue-60",
                "active": "$color-blue-70",
                "text": "$color-white"
            },
            "indigo": {
                "": "$color-indigo-60",
                "active": "$color-indigo-70",
                "text": "$color-white"
            },
            "violet": {
                "": "$color-violet-60",
                "active": "$color-violet-70",
                "text": "$color-white"
            },
            "purple": {
                "": "$color-purple-60",
                "active": "$color-purple-70",
                "text": "$color-white"
            },
            "fuchsia": {
                "": "$color-fuchsia-60",
                "active": "$color-fuchsia-70",
                "text": "$color-white"
            },
            "pink": {
                "": "$color-pink-60",
                "active": "$color-pink-70",
                "text": "$color-white"
            },
            "crimson": {
                "": "$color-crimson-60",
                "active": "$color-crimson-70",
                "text": "$color-white"
            },
            "red": {
                "": "$color-red-60",
                "active": "$color-red-70",
                "text": "$color-white"
            },
            "line": {
                "neutral": "$color-grey-60",
                "light": "oklch(0% 0 none / 0.12)",
                "lighter": "oklch(0% 0 none / 0.09)",
                "lightest": "oklch(0% 0 none / 0.06)"
            },
            "text": {
                "invert": "$color-white",
                "strong": "$color-grey-100",
                "neutral": "$color-grey-70",
                "lightest": "$color-grey-30",
                "lighter": "$color-grey-40",
                "light": "$color-grey-50",
                "stone": "$color-stone-60",
                "gray": "$color-gray-60",
                "grey": "$color-grey-60",
                "slate": "$color-slate-60",
                "brown": "$color-brown-60",
                "orange": "$color-orange-60",
                "amber": "$color-amber-60",
                "yellow": "$color-yellow-70",
                "lime": "$color-lime-70",
                "green": "$color-green-70",
                "beryl": "$color-beryl-70",
                "teal": "$color-teal-70",
                "cyan": "$color-cyan-70",
                "sky": "$color-sky-70",
                "blue": "$color-blue-60",
                "indigo": "$color-indigo-60",
                "violet": "$color-violet-60",
                "purple": "$color-purple-60",
                "fuchsia": "$color-fuchsia-60",
                "pink": "$color-pink-60",
                "crimson": "$color-crimson-60",
                "red": "$color-red-60"
            }
        },
    },
    "dark": {
        "color": {
            "ground": "$color-gray-100",
            "base": "$color-gray-95",
            "invert": "$color-white",
            "stone": {
                "": "$color-stone-40",
                "active": "$color-stone-30",
                "text": "$color-stone-95"
            },
            "gray": {
                "": "$color-gray-40",
                "active": "$color-gray-30",
                "text": "$color-gray-95"
            },
            "grey": {
                "": "$color-grey-40",
                "active": "$color-grey-30",
                "text": "$color-grey-95"
            },
            "slate": {
                "": "$color-slate-40",
                "active": "$color-slate-30",
                "text": "$color-slate-95"
            },
            "brown": {
                "": "$color-brown-50",
                "active": "$color-brown-40",
                "text": "$color-brown-95"
            },
            "orange": {
                "": "$color-orange-50",
                "active": "$color-orange-40",
                "text": "$color-orange-95"
            },
            "amber": {
                "": "$color-amber-50",
                "active": "$color-amber-30",
                "text": "$color-amber-95"
            },
            "yellow": {
                "": "$color-yellow-50",
                "active": "$color-yellow-30",
                "text": "$color-yellow-95"
            },
            "lime": {
                "": "$color-lime-50",
                "active": "$color-lime-30",
                "text": "$color-lime-95"
            },
            "green": {
                "": "$color-green-50",
                "active": "$color-green-30",
                "text": "$color-green-95"
            },
            "beryl": {
                "": "$color-beryl-50",
                "active": "$color-beryl-30",
                "text": "$color-beryl-95"
            },
            "teal": {
                "": "$color-teal-50",
                "active": "$color-teal-30",
                "text": "$color-teal-95"
            },
            "cyan": {
                "": "$color-cyan-50",
                "active": "$color-cyan-30",
                "text": "$color-cyan-95"
            },
            "sky": {
                "": "$color-sky-50",
                "active": "$color-sky-40",
                "text": "$color-white"
            },
            "blue": {
                "": "$color-blue-50",
                "active": "$color-blue-40",
                "text": "$color-white"
            },
            "indigo": {
                "": "$color-indigo-50",
                "active": "$color-indigo-40",
                "text": "$color-white"
            },
            "violet": {
                "": "$color-violet-50",
                "active": "$color-violet-40",
                "text": "$color-white"
            },
            "purple": {
                "": "$color-purple-50",
                "active": "$color-purple-40",
                "text": "$color-white"
            },
            "fuchsia": {
                "": "$color-fuchsia-50",
                "active": "$color-fuchsia-40",
                "text": "$color-white"
            },
            "pink": {
                "": "$color-pink-50",
                "active": "$color-pink-40",
                "text": "$color-white"
            },
            "crimson": {
                "": "$color-crimson-50",
                "active": "$color-crimson-40",
                "text": "$color-white"
            },
            "red": {
                "": "$color-red-50",
                "active": "$color-red-40",
                "text": "$color-white"
            },
            "line": {
                "neutral": "$color-gray-30",
                "light": "oklch(100% 0 none / 0.12)",
                "lighter": "oklch(100% 0 none / 0.09)",
                "lightest": "oklch(100% 0 none / 0.06)"
            },
            "text": {
                "invert": "$color-black",
                "strong": "$color-white",
                "neutral": "$color-gray-30",
                "lightest": "$color-gray-60",
                "lighter": "$color-gray-50",
                "light": "$color-gray-40",
                "stone": "$color-stone-30",
                "gray": "$color-gray-30",
                "grey": "$color-grey-30",
                "slate": "$color-slate-30",
                "brown": "$color-brown-30",
                "orange": "$color-orange-30",
                "amber": "$color-amber-40",
                "yellow": "$color-yellow-40",
                "lime": "$color-lime-40",
                "green": "$color-green-40",
                "beryl": "$color-beryl-40",
                "teal": "$color-teal-40",
                "cyan": "$color-cyan-40",
                "sky": "$color-sky-30",
                "blue": "$color-blue-30",
                "indigo": "$color-indigo-30",
                "violet": "$color-violet-30",
                "purple": "$color-purple-30",
                "fuchsia": "$color-fuchsia-30",
                "pink": "$color-pink-30",
                "crimson": "$color-crimson-30",
                "red": "$color-red-30"
            }
        },
    }
} satisfies ModeDefinitions

export default modes