/* eslint-disable quotes */
import type { VariableDefinitions } from 'shared/css-config'

const variables = [
    {
        "key": "full",
        "value": "100%"
    },
    {
        "key": "fit",
        "value": "fit-content"
    },
    {
        "key": "max",
        "value": "max-content"
    },
    {
        "key": "min",
        "value": "min-content"
    },
    {
        "namespace": "font-family",
        "key": "sans",
        "value": "\"Inter\", $font-family-sans-fallback"
    },
    {
        "namespace": "font-family",
        "key": "serif",
        "value": "$font-family-serif-fallback"
    },
    {
        "namespace": "font-family",
        "key": "mono",
        "value": "$font-family-mono-fallback"
    },
    {
        "namespace": "font-family",
        "key": "sans-fallback",
        "value": "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    },
    {
        "namespace": "font-family",
        "key": "serif-fallback",
        "value": "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
    },
    {
        "namespace": "font-family",
        "key": "mono-fallback",
        "value": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    },
    {
        "namespace": "letter-spacing",
        "key": "tightest",
        "value": "-0.072em"
    },
    {
        "namespace": "letter-spacing",
        "key": "tighter",
        "value": "-0.04em"
    },
    {
        "namespace": "letter-spacing",
        "key": "tight",
        "value": "-0.02em"
    },
    {
        "namespace": "letter-spacing",
        "key": "normal",
        "value": 0
    },
    {
        "namespace": "letter-spacing",
        "key": "wide",
        "value": "0.02em"
    },
    {
        "namespace": "letter-spacing",
        "key": "wider",
        "value": "0.04em"
    },
    {
        "namespace": "letter-spacing",
        "key": "widest",
        "value": "0.12em"
    },
    {
        "namespace": "line-height",
        "key": "xs",
        "value": 1.2
    },
    {
        "namespace": "line-height",
        "key": "sm",
        "value": 1.4
    },
    {
        "namespace": "line-height",
        "key": "md",
        "value": 1.6
    },
    {
        "namespace": "line-height",
        "key": "lg",
        "value": 1.8
    },
    {
        "namespace": "line-height",
        "key": "xl",
        "value": 2
    },
    {
        "namespace": "font-weight",
        "key": "thin",
        "value": 100
    },
    {
        "namespace": "font-weight",
        "key": "extralight",
        "value": 200
    },
    {
        "namespace": "font-weight",
        "key": "light",
        "value": 300
    },
    {
        "namespace": "font-weight",
        "key": "regular",
        "value": 400
    },
    {
        "namespace": "font-weight",
        "key": "medium",
        "value": 500
    },
    {
        "namespace": "font-weight",
        "key": "semibold",
        "value": 600
    },
    {
        "namespace": "font-weight",
        "key": "bold",
        "value": 700
    },
    {
        "namespace": "font-weight",
        "key": "extrabold",
        "value": 800
    },
    {
        "namespace": "font-weight",
        "key": "heavy",
        "value": 900
    },
    {
        "namespace": "font-size",
        "key": "3xs",
        "value": 8
    },
    {
        "namespace": "font-size",
        "key": "2xs",
        "value": 10
    },
    {
        "namespace": "font-size",
        "key": "xs",
        "value": 12
    },
    {
        "namespace": "font-size",
        "key": "sm",
        "value": 14
    },
    {
        "namespace": "font-size",
        "key": "md",
        "value": 16
    },
    {
        "namespace": "font-size",
        "key": "lg",
        "value": 18
    },
    {
        "namespace": "font-size",
        "key": "xl",
        "value": 20
    },
    {
        "namespace": "font-size",
        "key": "2xl",
        "value": 24
    },
    {
        "namespace": "font-size",
        "key": "3xl",
        "value": 32
    },
    {
        "namespace": "font-size",
        "key": "4xl",
        "value": 36
    },
    {
        "namespace": "font-size",
        "key": "5xl",
        "value": 40
    },
    {
        "namespace": "font-size",
        "key": "6xl",
        "value": 48
    },
    {
        "namespace": "font-size",
        "key": "7xl",
        "value": 60
    },
    {
        "namespace": "font-size",
        "key": "8xl",
        "value": 72
    },
    {
        "namespace": "font-size",
        "key": "9xl",
        "value": 96
    },
    {
        "namespace": "font-size",
        "key": "10xl",
        "value": 128
    },
    {
        "namespace": "border-radius",
        "key": "xs",
        "value": 2
    },
    {
        "namespace": "border-radius",
        "key": "sm",
        "value": 4
    },
    {
        "namespace": "border-radius",
        "key": "md",
        "value": 6
    },
    {
        "namespace": "border-radius",
        "key": "lg",
        "value": 8
    },
    {
        "namespace": "border-radius",
        "key": "xl",
        "value": 12
    },
    {
        "namespace": "border-radius",
        "key": "2xl",
        "value": 16
    },
    {
        "namespace": "border-radius",
        "key": "3xl",
        "value": 24
    },
    {
        "namespace": "border-radius",
        "key": "4xl",
        "value": 32
    },
    {
        "namespace": "order",
        "key": "first",
        "value": -999999
    },
    {
        "namespace": "order",
        "key": "last",
        "value": 999999
    },
    {
        "namespace": "spacing",
        "key": "4xs",
        "value": 2
    },
    {
        "namespace": "spacing",
        "key": "3xs",
        "value": 4
    },
    {
        "namespace": "spacing",
        "key": "2xs",
        "value": 6
    },
    {
        "namespace": "spacing",
        "key": "xs",
        "value": 8
    },
    {
        "namespace": "spacing",
        "key": "sm",
        "value": 12
    },
    {
        "namespace": "spacing",
        "key": "md",
        "value": 16
    },
    {
        "namespace": "spacing",
        "key": "lg",
        "value": 24
    },
    {
        "namespace": "spacing",
        "key": "xl",
        "value": 32
    },
    {
        "namespace": "spacing",
        "key": "2xl",
        "value": 48
    },
    {
        "namespace": "spacing",
        "key": "3xl",
        "value": 64
    },
    {
        "namespace": "spacing",
        "key": "4xl",
        "value": 96
    },
    {
        "namespace": "spacing",
        "key": "5xl",
        "value": 128
    },
    {
        "namespace": "duration",
        "key": "fastest",
        "value": "75ms"
    },
    {
        "namespace": "duration",
        "key": "faster",
        "value": "100ms"
    },
    {
        "namespace": "duration",
        "key": "fast",
        "value": "150ms"
    },
    {
        "namespace": "duration",
        "key": "slow",
        "value": "300ms"
    },
    {
        "namespace": "duration",
        "key": "slower",
        "value": "500ms"
    },
    {
        "namespace": "duration",
        "key": "slowest",
        "value": "800ms"
    },
    {
        "namespace": "easing",
        "key": "smooth",
        "value": "cubic-bezier(.4,0,.2,1)"
    },
    {
        "namespace": "easing",
        "key": "soft",
        "value": "cubic-bezier(.33,1,.68,1)"
    },
    {
        "namespace": "easing",
        "key": "crisp",
        "value": "cubic-bezier(.16,1,.3,1)"
    },
    {
        "namespace": "easing",
        "key": "snap",
        "value": "cubic-bezier(.2,0,0,1)"
    },
    {
        "namespace": "easing",
        "key": "accelerate",
        "value": "cubic-bezier(.4,0,1,1)"
    },
    {
        "namespace": "easing",
        "key": "decelerate",
        "value": "cubic-bezier(0,0,.2,1)"
    },
    {
        "namespace": "easing",
        "key": "overshoot",
        "value": "cubic-bezier(.34,1.56,.64,1)"
    },
    {
        "namespace": "easing",
        "key": "rewind",
        "value": "cubic-bezier(.36,0,.66,-.56)"
    },
    {
        "namespace": "easing",
        "key": "spring",
        "value": "cubic-bezier(.68,-.6,.32,1.6)"
    },
    {
        "namespace": "shadow",
        "key": "xs",
        "value": "0 1px 2px oklch(0% 0 none / .08)"
    },
    {
        "namespace": "shadow",
        "key": "sm",
        "value": "0 1px 2px oklch(0% 0 none / .06), 0 2px 4px oklch(0% 0 none / .06)"
    },
    {
        "namespace": "shadow",
        "key": "md",
        "value": "0 2px 4px -1px oklch(0% 0 none / .08), 0 6px 12px -2px oklch(0% 0 none / .08)"
    },
    {
        "namespace": "shadow",
        "key": "lg",
        "value": "0 4px 8px -2px oklch(0% 0 none / .08), 0 12px 24px -4px oklch(0% 0 none / .10)"
    },
    {
        "namespace": "shadow",
        "key": "xl",
        "value": "0 8px 16px -4px oklch(0% 0 none / .10), 0 20px 40px -8px oklch(0% 0 none / .12)"
    },
    {
        "namespace": "shadow",
        "key": "2xl",
        "value": "0 16px 24px -8px oklch(0% 0 none / .12), 0 32px 64px -16px oklch(0% 0 none / .16)"
    },
    {
        "namespace": "color",
        "key": "current",
        "value": "currentColor"
    },
    {
        "namespace": "color",
        "key": "white",
        "value": "oklch(100% 0 none)"
    },
    {
        "namespace": "color",
        "key": "black",
        "value": "oklch(0% 0 none)"
    },
    {
        "namespace": "color",
        "key": "stone-0",
        "value": "oklch(99% 0.0033 72)"
    },
    {
        "namespace": "color",
        "key": "stone-5",
        "value": "oklch(94.9% 0.0066 72)"
    },
    {
        "namespace": "color",
        "key": "stone-10",
        "value": "oklch(90.8% 0.0172 72)"
    },
    {
        "namespace": "color",
        "key": "stone-20",
        "value": "oklch(82.6% 0.0287 72)"
    },
    {
        "namespace": "color",
        "key": "stone-30",
        "value": "oklch(74.4% 0.04 72)"
    },
    {
        "namespace": "color",
        "key": "stone-40",
        "value": "oklch(66.2% 0.044 72)"
    },
    {
        "namespace": "color",
        "key": "stone-50",
        "value": "oklch(58% 0.045 72)"
    },
    {
        "namespace": "color",
        "key": "stone-60",
        "value": "oklch(49.8% 0.033 72)"
    },
    {
        "namespace": "color",
        "key": "stone-70",
        "value": "oklch(41.6% 0.0275 72)"
    },
    {
        "namespace": "color",
        "key": "stone-80",
        "value": "oklch(33.4% 0.022 72)"
    },
    {
        "namespace": "color",
        "key": "stone-90",
        "value": "oklch(25.2% 0.0105 72)"
    },
    {
        "namespace": "color",
        "key": "stone-95",
        "value": "oklch(21.1% 0.0079 72)"
    },
    {
        "namespace": "color",
        "key": "stone-100",
        "value": "oklch(17% 0.0053 72)"
    },
    {
        "namespace": "color",
        "key": "gray-0",
        "value": "oklch(98.48% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-5",
        "value": "oklch(96.5% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-10",
        "value": "oklch(90% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-20",
        "value": "oklch(82% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-30",
        "value": "oklch(73.5% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-40",
        "value": "oklch(65% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-50",
        "value": "oklch(55.2% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-60",
        "value": "oklch(48% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-70",
        "value": "oklch(39.5% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-80",
        "value": "oklch(31% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-90",
        "value": "oklch(23.5% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-95",
        "value": "oklch(18.5% 0 none)"
    },
    {
        "namespace": "color",
        "key": "gray-100",
        "value": "oklch(14.5% 0 none)"
    },
    {
        "namespace": "color",
        "key": "grey-0",
        "value": "oklch(98.38% 0.0033 249.7)"
    },
    {
        "namespace": "color",
        "key": "grey-5",
        "value": "oklch(95.52% 0.0099 270)"
    },
    {
        "namespace": "color",
        "key": "grey-10",
        "value": "oklch(90% 0.014 272)"
    },
    {
        "namespace": "color",
        "key": "grey-20",
        "value": "oklch(82% 0.02 272)"
    },
    {
        "namespace": "color",
        "key": "grey-30",
        "value": "oklch(73.5% 0.027 272)"
    },
    {
        "namespace": "color",
        "key": "grey-40",
        "value": "oklch(65% 0.032 273)"
    },
    {
        "namespace": "color",
        "key": "grey-50",
        "value": "oklch(55.2% 0.035 273)"
    },
    {
        "namespace": "color",
        "key": "grey-60",
        "value": "oklch(48% 0.032 273)"
    },
    {
        "namespace": "color",
        "key": "grey-70",
        "value": "oklch(39.5% 0.027 273)"
    },
    {
        "namespace": "color",
        "key": "grey-80",
        "value": "oklch(31% 0.022 273)"
    },
    {
        "namespace": "color",
        "key": "grey-90",
        "value": "oklch(23.5% 0.016 273)"
    },
    {
        "namespace": "color",
        "key": "grey-95",
        "value": "oklch(18.5% 0.012 273)"
    },
    {
        "namespace": "color",
        "key": "grey-100",
        "value": "oklch(14.5% 0.009 273)"
    },
    {
        "namespace": "color",
        "key": "slate-0",
        "value": "oklch(98.07% 0.0092 257.1)"
    },
    {
        "namespace": "color",
        "key": "slate-5",
        "value": "oklch(96.15% 0.0181 267.3)"
    },
    {
        "namespace": "color",
        "key": "slate-10",
        "value": "oklch(90.16% 0.0352 268.2)"
    },
    {
        "namespace": "color",
        "key": "slate-20",
        "value": "oklch(82.16% 0.045 268.2)"
    },
    {
        "namespace": "color",
        "key": "slate-30",
        "value": "oklch(74.16% 0.069 268.2)"
    },
    {
        "namespace": "color",
        "key": "slate-40",
        "value": "oklch(63.99% 0.0804 266.1)"
    },
    {
        "namespace": "color",
        "key": "slate-50",
        "value": "oklch(55.43% 0.0949 263.4)"
    },
    {
        "namespace": "color",
        "key": "slate-60",
        "value": "oklch(45.03% 0.0817 265.9)"
    },
    {
        "namespace": "color",
        "key": "slate-70",
        "value": "oklch(39% 0.0702 263.9)"
    },
    {
        "namespace": "color",
        "key": "slate-80",
        "value": "oklch(32.14% 0.0604 264.8)"
    },
    {
        "namespace": "color",
        "key": "slate-90",
        "value": "oklch(27.33% 0.0536 264.8)"
    },
    {
        "namespace": "color",
        "key": "slate-95",
        "value": "oklch(21.5% 0.0573 267.4)"
    },
    {
        "namespace": "color",
        "key": "slate-100",
        "value": "oklch(17.5% 0.0688 267.4)"
    },
    {
        "namespace": "color",
        "key": "brown-0",
        "value": "oklch(97% 0.0161 47.15)"
    },
    {
        "namespace": "color",
        "key": "brown-5",
        "value": "oklch(95.48% 0.0229 34.84)"
    },
    {
        "namespace": "color",
        "key": "brown-10",
        "value": "oklch(88.65% 0.0606 33.36)"
    },
    {
        "namespace": "color",
        "key": "brown-20",
        "value": "oklch(81.37% 0.1065 33.59)"
    },
    {
        "namespace": "color",
        "key": "brown-30",
        "value": "oklch(74.39% 0.12 32.5)"
    },
    {
        "namespace": "color",
        "key": "brown-40",
        "value": "oklch(67.62% 0.12 32.5)"
    },
    {
        "namespace": "color",
        "key": "brown-50",
        "value": "oklch(61.9% 0.12 32.5)"
    },
    {
        "namespace": "color",
        "key": "brown-60",
        "value": "oklch(55.58% 0.12 32.5)"
    },
    {
        "namespace": "color",
        "key": "brown-70",
        "value": "oklch(49.11% 0.12 32.5)"
    },
    {
        "namespace": "color",
        "key": "brown-80",
        "value": "oklch(42.07% 0.12 32.5)"
    },
    {
        "namespace": "color",
        "key": "brown-90",
        "value": "oklch(35.11% 0.12 32.5)"
    },
    {
        "namespace": "color",
        "key": "brown-95",
        "value": "oklch(24.7% 0.0958 31.18)"
    },
    {
        "namespace": "color",
        "key": "brown-100",
        "value": "oklch(21.21% 0.0822 31.17)"
    },
    {
        "namespace": "color",
        "key": "orange-0",
        "value": "oklch(96.76% 0.0337 84.59)"
    },
    {
        "namespace": "color",
        "key": "orange-5",
        "value": "oklch(94.78% 0.0521 82.97)"
    },
    {
        "namespace": "color",
        "key": "orange-10",
        "value": "oklch(89.94% 0.0852 75.65)"
    },
    {
        "namespace": "color",
        "key": "orange-20",
        "value": "oklch(82.86% 0.1343 69.21)"
    },
    {
        "namespace": "color",
        "key": "orange-30",
        "value": "oklch(75.09% 0.179 58.39)"
    },
    {
        "namespace": "color",
        "key": "orange-40",
        "value": "oklch(71.4% 0.1941 48.13)"
    },
    {
        "namespace": "color",
        "key": "orange-50",
        "value": "oklch(66.61% 0.2247 36.66)"
    },
    {
        "namespace": "color",
        "key": "orange-60",
        "value": "oklch(61.68% 0.2388 31.22)"
    },
    {
        "namespace": "color",
        "key": "orange-70",
        "value": "oklch(53.53% 0.2196 29.23)"
    },
    {
        "namespace": "color",
        "key": "orange-80",
        "value": "oklch(46.33% 0.1901 29.23)"
    },
    {
        "namespace": "color",
        "key": "orange-90",
        "value": "oklch(36.63% 0.1503 29.23)"
    },
    {
        "namespace": "color",
        "key": "orange-95",
        "value": "oklch(25.4% 0.1042 29.23)"
    },
    {
        "namespace": "color",
        "key": "orange-100",
        "value": "oklch(21.44% 0.088 29.23)"
    },
    {
        "namespace": "color",
        "key": "amber-0",
        "value": "oklch(97.5% 0.051 98.98)"
    },
    {
        "namespace": "color",
        "key": "amber-5",
        "value": "oklch(96.24% 0.0716 98.08)"
    },
    {
        "namespace": "color",
        "key": "amber-10",
        "value": "oklch(93.46% 0.1082 95.78)"
    },
    {
        "namespace": "color",
        "key": "amber-20",
        "value": "oklch(88.25% 0.1592 91.33)"
    },
    {
        "namespace": "color",
        "key": "amber-30",
        "value": "oklch(86% 0.1633 86.92)"
    },
    {
        "namespace": "color",
        "key": "amber-40",
        "value": "oklch(83.04% 0.1701 81.13)"
    },
    {
        "namespace": "color",
        "key": "amber-50",
        "value": "oklch(79.4% 0.1709 71.06)"
    },
    {
        "namespace": "color",
        "key": "amber-60",
        "value": "oklch(73.31% 0.1784 56.52)"
    },
    {
        "namespace": "color",
        "key": "amber-70",
        "value": "oklch(63.23% 0.1757 46.71)"
    },
    {
        "namespace": "color",
        "key": "amber-80",
        "value": "oklch(53.09% 0.1677 39.66)"
    },
    {
        "namespace": "color",
        "key": "amber-90",
        "value": "oklch(42.68% 0.138 38.58)"
    },
    {
        "namespace": "color",
        "key": "amber-95",
        "value": "oklch(29.27% 0.0971 37.42)"
    },
    {
        "namespace": "color",
        "key": "amber-100",
        "value": "oklch(23.94% 0.0818 36.09)"
    },
    {
        "namespace": "color",
        "key": "yellow-0",
        "value": "oklch(98.86% 0.0591 107.4)"
    },
    {
        "namespace": "color",
        "key": "yellow-5",
        "value": "oklch(98.27% 0.0948 108)"
    },
    {
        "namespace": "color",
        "key": "yellow-10",
        "value": "oklch(97.31% 0.1645 109.1)"
    },
    {
        "namespace": "color",
        "key": "yellow-20",
        "value": "oklch(95.82% 0.207 108.4)"
    },
    {
        "namespace": "color",
        "key": "yellow-30",
        "value": "oklch(93.51% 0.1981 104.7)"
    },
    {
        "namespace": "color",
        "key": "yellow-40",
        "value": "oklch(91.5% 0.1909 101.1)"
    },
    {
        "namespace": "color",
        "key": "yellow-50",
        "value": "oklch(87.52% 0.1796 94.59)"
    },
    {
        "namespace": "color",
        "key": "yellow-60",
        "value": "oklch(82.02% 0.169 82.09)"
    },
    {
        "namespace": "color",
        "key": "yellow-70",
        "value": "oklch(72.04% 0.1592 66.98)"
    },
    {
        "namespace": "color",
        "key": "yellow-80",
        "value": "oklch(64.84% 0.1477 63.12)"
    },
    {
        "namespace": "color",
        "key": "yellow-90",
        "value": "oklch(52.17% 0.1199 62.19)"
    },
    {
        "namespace": "color",
        "key": "yellow-95",
        "value": "oklch(33.35% 0.083 54.56)"
    },
    {
        "namespace": "color",
        "key": "yellow-100",
        "value": "oklch(26.22% 0.0646 55.44)"
    },
    {
        "namespace": "color",
        "key": "lime-0",
        "value": "oklch(98.05% 0.0665 116)"
    },
    {
        "namespace": "color",
        "key": "lime-5",
        "value": "oklch(96.62% 0.1 121.2)"
    },
    {
        "namespace": "color",
        "key": "lime-10",
        "value": "oklch(95.06% 0.1566 121.5)"
    },
    {
        "namespace": "color",
        "key": "lime-20",
        "value": "oklch(92.45% 0.2251 126)"
    },
    {
        "namespace": "color",
        "key": "lime-30",
        "value": "oklch(87.79% 0.2261 126.9)"
    },
    {
        "namespace": "color",
        "key": "lime-40",
        "value": "oklch(82.22% 0.225 131.1)"
    },
    {
        "namespace": "color",
        "key": "lime-50",
        "value": "oklch(74.39% 0.2131 133.9)"
    },
    {
        "namespace": "color",
        "key": "lime-60",
        "value": "oklch(66.45% 0.195 135.3)"
    },
    {
        "namespace": "color",
        "key": "lime-70",
        "value": "oklch(58.7% 0.1769 136.7)"
    },
    {
        "namespace": "color",
        "key": "lime-80",
        "value": "oklch(51.46% 0.1612 138.7)"
    },
    {
        "namespace": "color",
        "key": "lime-90",
        "value": "oklch(44.54% 0.1437 140.1)"
    },
    {
        "namespace": "color",
        "key": "lime-95",
        "value": "oklch(29.84% 0.097 140.4)"
    },
    {
        "namespace": "color",
        "key": "lime-100",
        "value": "oklch(25.83% 0.0851 141.1)"
    },
    {
        "namespace": "color",
        "key": "green-0",
        "value": "oklch(97% 0.0508 145.7)"
    },
    {
        "namespace": "color",
        "key": "green-5",
        "value": "oklch(94.95% 0.0888 145.5)"
    },
    {
        "namespace": "color",
        "key": "green-10",
        "value": "oklch(92.05% 0.1473 145.7)"
    },
    {
        "namespace": "color",
        "key": "green-20",
        "value": "oklch(89.18% 0.2191 143.8)"
    },
    {
        "namespace": "color",
        "key": "green-30",
        "value": "oklch(84.3% 0.24 143.9)"
    },
    {
        "namespace": "color",
        "key": "green-40",
        "value": "oklch(77.68% 0.25 144.1)"
    },
    {
        "namespace": "color",
        "key": "green-50",
        "value": "oklch(72.41% 0.2464 142.5)"
    },
    {
        "namespace": "color",
        "key": "green-60",
        "value": "oklch(67.52% 0.2298 142.5)"
    },
    {
        "namespace": "color",
        "key": "green-70",
        "value": "oklch(58.66% 0.1996 142.5)"
    },
    {
        "namespace": "color",
        "key": "green-80",
        "value": "oklch(51.96% 0.1768 142.5)"
    },
    {
        "namespace": "color",
        "key": "green-90",
        "value": "oklch(44.03% 0.1498 142.5)"
    },
    {
        "namespace": "color",
        "key": "green-95",
        "value": "oklch(30.17% 0.1027 142.5)"
    },
    {
        "namespace": "color",
        "key": "green-100",
        "value": "oklch(26.35% 0.0897 142.5)"
    },
    {
        "namespace": "color",
        "key": "beryl-0",
        "value": "oklch(96.57% 0.05 163.7)"
    },
    {
        "namespace": "color",
        "key": "beryl-5",
        "value": "oklch(94.71% 0.0792 163.5)"
    },
    {
        "namespace": "color",
        "key": "beryl-10",
        "value": "oklch(91.87% 0.128 162.2)"
    },
    {
        "namespace": "color",
        "key": "beryl-20",
        "value": "oklch(90.33% 0.1569 161.2)"
    },
    {
        "namespace": "color",
        "key": "beryl-30",
        "value": "oklch(86.43% 0.2104 155.8)"
    },
    {
        "namespace": "color",
        "key": "beryl-40",
        "value": "oklch(82.49% 0.1978 156.6)"
    },
    {
        "namespace": "color",
        "key": "beryl-50",
        "value": "oklch(76.89% 0.1885 155.4)"
    },
    {
        "namespace": "color",
        "key": "beryl-60",
        "value": "oklch(69.77% 0.1794 153.1)"
    },
    {
        "namespace": "color",
        "key": "beryl-70",
        "value": "oklch(60.74% 0.1602 151.9)"
    },
    {
        "namespace": "color",
        "key": "beryl-80",
        "value": "oklch(54.36% 0.1421 152.3)"
    },
    {
        "namespace": "color",
        "key": "beryl-90",
        "value": "oklch(46.09% 0.1213 152)"
    },
    {
        "namespace": "color",
        "key": "beryl-95",
        "value": "oklch(30.39% 0.0888 147.6)"
    },
    {
        "namespace": "color",
        "key": "beryl-100",
        "value": "oklch(26.71% 0.0855 144.4)"
    },
    {
        "namespace": "color",
        "key": "teal-0",
        "value": "oklch(97.24% 0.0384 179.8)"
    },
    {
        "namespace": "color",
        "key": "teal-5",
        "value": "oklch(94.3% 0.0826 180.5)"
    },
    {
        "namespace": "color",
        "key": "teal-10",
        "value": "oklch(92.33% 0.1148 181.5)"
    },
    {
        "namespace": "color",
        "key": "teal-20",
        "value": "oklch(91.3% 0.1327 183.1)"
    },
    {
        "namespace": "color",
        "key": "teal-30",
        "value": "oklch(90.52% 0.1472 184.8)"
    },
    {
        "namespace": "color",
        "key": "teal-40",
        "value": "oklch(89.99% 0.1577 186.3)"
    },
    {
        "namespace": "color",
        "key": "teal-50",
        "value": "oklch(86.13% 0.1485 190.5)"
    },
    {
        "namespace": "color",
        "key": "teal-60",
        "value": "oklch(79.38% 0.1355 194.8)"
    },
    {
        "namespace": "color",
        "key": "teal-70",
        "value": "oklch(67.86% 0.1154 199.2)"
    },
    {
        "namespace": "color",
        "key": "teal-80",
        "value": "oklch(60.62% 0.1033 203.7)"
    },
    {
        "namespace": "color",
        "key": "teal-90",
        "value": "oklch(52.19% 0.0898 208.3)"
    },
    {
        "namespace": "color",
        "key": "teal-95",
        "value": "oklch(31.94% 0.0584 220.7)"
    },
    {
        "namespace": "color",
        "key": "teal-100",
        "value": "oklch(28.34% 0.0534 224.3)"
    },
    {
        "namespace": "color",
        "key": "cyan-0",
        "value": "oklch(97.47% 0.0367 196.6)"
    },
    {
        "namespace": "color",
        "key": "cyan-5",
        "value": "oklch(95.05% 0.0748 196)"
    },
    {
        "namespace": "color",
        "key": "cyan-10",
        "value": "oklch(92.28% 0.1122 196.9)"
    },
    {
        "namespace": "color",
        "key": "cyan-20",
        "value": "oklch(89.98% 0.1264 200.1)"
    },
    {
        "namespace": "color",
        "key": "cyan-30",
        "value": "oklch(87.28% 0.1376 204.3)"
    },
    {
        "namespace": "color",
        "key": "cyan-40",
        "value": "oklch(84.82% 0.1408 209.5)"
    },
    {
        "namespace": "color",
        "key": "cyan-50",
        "value": "oklch(81.54% 0.1453 216.7)"
    },
    {
        "namespace": "color",
        "key": "cyan-60",
        "value": "oklch(77.57% 0.1494 226.7)"
    },
    {
        "namespace": "color",
        "key": "cyan-70",
        "value": "oklch(70.27% 0.1509 235.9)"
    },
    {
        "namespace": "color",
        "key": "cyan-80",
        "value": "oklch(63.25% 0.1493 241.7)"
    },
    {
        "namespace": "color",
        "key": "cyan-90",
        "value": "oklch(52.16% 0.1354 246.4)"
    },
    {
        "namespace": "color",
        "key": "cyan-95",
        "value": "oklch(35.21% 0.0976 249.2)"
    },
    {
        "namespace": "color",
        "key": "cyan-100",
        "value": "oklch(30.27% 0.0847 249.6)"
    },
    {
        "namespace": "color",
        "key": "sky-0",
        "value": "oklch(97.39% 0.0232 209.4)"
    },
    {
        "namespace": "color",
        "key": "sky-5",
        "value": "oklch(94.65% 0.0448 212.1)"
    },
    {
        "namespace": "color",
        "key": "sky-10",
        "value": "oklch(90.51% 0.0725 216.5)"
    },
    {
        "namespace": "color",
        "key": "sky-20",
        "value": "oklch(86.58% 0.0902 224)"
    },
    {
        "namespace": "color",
        "key": "sky-30",
        "value": "oklch(77.94% 0.1431 228.4)"
    },
    {
        "namespace": "color",
        "key": "sky-40",
        "value": "oklch(72.24% 0.1626 239)"
    },
    {
        "namespace": "color",
        "key": "sky-50",
        "value": "oklch(67.09% 0.1828 248.5)"
    },
    {
        "namespace": "color",
        "key": "sky-60",
        "value": "oklch(62.09% 0.2077 255.4)"
    },
    {
        "namespace": "color",
        "key": "sky-70",
        "value": "oklch(55.12% 0.2483 261.6)"
    },
    {
        "namespace": "color",
        "key": "sky-80",
        "value": "oklch(49.98% 0.2769 263.8)"
    },
    {
        "namespace": "color",
        "key": "sky-90",
        "value": "oklch(40.76% 0.2499 264.2)"
    },
    {
        "namespace": "color",
        "key": "sky-95",
        "value": "oklch(28.37% 0.1946 265.1)"
    },
    {
        "namespace": "color",
        "key": "sky-100",
        "value": "oklch(25.85% 0.1768 265.4)"
    },
    {
        "namespace": "color",
        "key": "blue-0",
        "value": "oklch(97.5% 0.0175 219.7)"
    },
    {
        "namespace": "color",
        "key": "blue-5",
        "value": "oklch(93.53% 0.0381 231.3)"
    },
    {
        "namespace": "color",
        "key": "blue-10",
        "value": "oklch(90.01% 0.0564 236.1)"
    },
    {
        "namespace": "color",
        "key": "blue-20",
        "value": "oklch(81.69% 0.0975 246.5)"
    },
    {
        "namespace": "color",
        "key": "blue-30",
        "value": "oklch(72.87% 0.1468 249.3)"
    },
    {
        "namespace": "color",
        "key": "blue-40",
        "value": "oklch(64.31% 0.1921 258.5)"
    },
    {
        "namespace": "color",
        "key": "blue-50",
        "value": "oklch(58.22% 0.2279 263.9)"
    },
    {
        "namespace": "color",
        "key": "blue-60",
        "value": "oklch(51.83% 0.2687 266.1)"
    },
    {
        "namespace": "color",
        "key": "blue-70",
        "value": "oklch(46.26% 0.3057 266.7)"
    },
    {
        "namespace": "color",
        "key": "blue-80",
        "value": "oklch(42.89% 0.2907 266.3)"
    },
    {
        "namespace": "color",
        "key": "blue-90",
        "value": "oklch(39.4% 0.2629 268)"
    },
    {
        "namespace": "color",
        "key": "blue-95",
        "value": "oklch(28.64% 0.1893 269)"
    },
    {
        "namespace": "color",
        "key": "blue-100",
        "value": "oklch(25.46% 0.168 269.2)"
    },
    {
        "namespace": "color",
        "key": "indigo-0",
        "value": "oklch(97.1% 0.0138 257.2)"
    },
    {
        "namespace": "color",
        "key": "indigo-5",
        "value": "oklch(94.11% 0.0285 279.6)"
    },
    {
        "namespace": "color",
        "key": "indigo-10",
        "value": "oklch(87.83% 0.0595 274.4)"
    },
    {
        "namespace": "color",
        "key": "indigo-20",
        "value": "oklch(77.74% 0.1153 280.2)"
    },
    {
        "namespace": "color",
        "key": "indigo-30",
        "value": "oklch(70.2% 0.1611 282.9)"
    },
    {
        "namespace": "color",
        "key": "indigo-40",
        "value": "oklch(61.3% 0.218 284)"
    },
    {
        "namespace": "color",
        "key": "indigo-50",
        "value": "oklch(56.78% 0.2478 284.1)"
    },
    {
        "namespace": "color",
        "key": "indigo-60",
        "value": "oklch(50.06% 0.2906 282)"
    },
    {
        "namespace": "color",
        "key": "indigo-70",
        "value": "oklch(48.74% 0.2963 279.3)"
    },
    {
        "namespace": "color",
        "key": "indigo-80",
        "value": "oklch(48.25% 0.2976 277.4)"
    },
    {
        "namespace": "color",
        "key": "indigo-90",
        "value": "oklch(41.46% 0.2571 276.7)"
    },
    {
        "namespace": "color",
        "key": "indigo-95",
        "value": "oklch(29.36% 0.1799 278.3)"
    },
    {
        "namespace": "color",
        "key": "indigo-100",
        "value": "oklch(25.28% 0.1551 278.1)"
    },
    {
        "namespace": "color",
        "key": "violet-0",
        "value": "oklch(97.96% 0.0166 322.8)"
    },
    {
        "namespace": "color",
        "key": "violet-5",
        "value": "oklch(94.02% 0.0333 299.5)"
    },
    {
        "namespace": "color",
        "key": "violet-10",
        "value": "oklch(88.69% 0.0648 300.1)"
    },
    {
        "namespace": "color",
        "key": "violet-20",
        "value": "oklch(80.47% 0.113 297.7)"
    },
    {
        "namespace": "color",
        "key": "violet-30",
        "value": "oklch(71.63% 0.1722 298.7)"
    },
    {
        "namespace": "color",
        "key": "violet-40",
        "value": "oklch(62.1% 0.237 297.8)"
    },
    {
        "namespace": "color",
        "key": "violet-50",
        "value": "oklch(56.23% 0.2803 297.8)"
    },
    {
        "namespace": "color",
        "key": "violet-60",
        "value": "oklch(52.55% 0.293 292.4)"
    },
    {
        "namespace": "color",
        "key": "violet-70",
        "value": "oklch(51.12% 0.2931 287.9)"
    },
    {
        "namespace": "color",
        "key": "violet-80",
        "value": "oklch(48.43% 0.2798 286.7)"
    },
    {
        "namespace": "color",
        "key": "violet-90",
        "value": "oklch(40.64% 0.2331 287.9)"
    },
    {
        "namespace": "color",
        "key": "violet-95",
        "value": "oklch(28.51% 0.1631 288.3)"
    },
    {
        "namespace": "color",
        "key": "violet-100",
        "value": "oklch(24.44% 0.1403 287.8)"
    },
    {
        "namespace": "color",
        "key": "purple-0",
        "value": "oklch(97.07% 0.0259 325.8)"
    },
    {
        "namespace": "color",
        "key": "purple-5",
        "value": "oklch(94.28% 0.0394 314.4)"
    },
    {
        "namespace": "color",
        "key": "purple-10",
        "value": "oklch(89.13% 0.0771 314.7)"
    },
    {
        "namespace": "color",
        "key": "purple-20",
        "value": "oklch(81.4% 0.1318 312.8)"
    },
    {
        "namespace": "color",
        "key": "purple-30",
        "value": "oklch(72.72% 0.2007 312.8)"
    },
    {
        "namespace": "color",
        "key": "purple-40",
        "value": "oklch(63.36% 0.2677 310)"
    },
    {
        "namespace": "color",
        "key": "purple-50",
        "value": "oklch(58.21% 0.2988 307.2)"
    },
    {
        "namespace": "color",
        "key": "purple-60",
        "value": "oklch(55.59% 0.2952 301)"
    },
    {
        "namespace": "color",
        "key": "purple-70",
        "value": "oklch(54.45% 0.294 297.9)"
    },
    {
        "namespace": "color",
        "key": "purple-80",
        "value": "oklch(48.76% 0.264 297.5)"
    },
    {
        "namespace": "color",
        "key": "purple-90",
        "value": "oklch(39.15% 0.2105 298.7)"
    },
    {
        "namespace": "color",
        "key": "purple-95",
        "value": "oklch(27.95% 0.1488 300.5)"
    },
    {
        "namespace": "color",
        "key": "purple-100",
        "value": "oklch(24.3% 0.128 302.4)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-0",
        "value": "oklch(97.07% 0.0259 325.8)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-5",
        "value": "oklch(94.57% 0.0472 324.9)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-10",
        "value": "oklch(89.9% 0.0935 326.3)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-20",
        "value": "oklch(81.84% 0.1554 322)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-30",
        "value": "oklch(74.78% 0.2085 319.1)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-40",
        "value": "oklch(67.61% 0.25 316.5)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-50",
        "value": "oklch(62.91% 0.25 316.7)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-60",
        "value": "oklch(58.72% 0.25 311.8)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-70",
        "value": "oklch(53.61% 0.25 312.8)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-80",
        "value": "oklch(47.9% 0.2382 313.2)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-90",
        "value": "oklch(38.62% 0.1895 315.8)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-95",
        "value": "oklch(27.75% 0.1357 316.4)"
    },
    {
        "namespace": "color",
        "key": "fuchsia-100",
        "value": "oklch(23.7% 0.1162 315.9)"
    },
    {
        "namespace": "color",
        "key": "pink-0",
        "value": "oklch(97.07% 0.0259 325.8)"
    },
    {
        "namespace": "color",
        "key": "pink-5",
        "value": "oklch(94.74% 0.0465 326.5)"
    },
    {
        "namespace": "color",
        "key": "pink-10",
        "value": "oklch(88.85% 0.0902 332.8)"
    },
    {
        "namespace": "color",
        "key": "pink-20",
        "value": "oklch(81.57% 0.1379 341.6)"
    },
    {
        "namespace": "color",
        "key": "pink-30",
        "value": "oklch(74.68% 0.2018 342.5)"
    },
    {
        "namespace": "color",
        "key": "pink-40",
        "value": "oklch(69.18% 0.2455 347.6)"
    },
    {
        "namespace": "color",
        "key": "pink-50",
        "value": "oklch(65.84% 0.25 350.7)"
    },
    {
        "namespace": "color",
        "key": "pink-60",
        "value": "oklch(63.54% 0.25 359.2)"
    },
    {
        "namespace": "color",
        "key": "pink-70",
        "value": "oklch(58.95% 0.2377 2.647)"
    },
    {
        "namespace": "color",
        "key": "pink-80",
        "value": "oklch(53% 0.2126 6.362)"
    },
    {
        "namespace": "color",
        "key": "pink-90",
        "value": "oklch(43.66% 0.1748 8.099)"
    },
    {
        "namespace": "color",
        "key": "pink-95",
        "value": "oklch(31.48% 0.1261 7.759)"
    },
    {
        "namespace": "color",
        "key": "pink-100",
        "value": "oklch(27.42% 0.1098 8.521)"
    },
    {
        "namespace": "color",
        "key": "crimson-0",
        "value": "oklch(97.07% 0.0259 325.8)"
    },
    {
        "namespace": "color",
        "key": "crimson-5",
        "value": "oklch(94.2% 0.0332 353.2)"
    },
    {
        "namespace": "color",
        "key": "crimson-10",
        "value": "oklch(88.09% 0.0677 1.012)"
    },
    {
        "namespace": "color",
        "key": "crimson-20",
        "value": "oklch(80.33% 0.1184 4.549)"
    },
    {
        "namespace": "color",
        "key": "crimson-30",
        "value": "oklch(72.9% 0.1774 4.449)"
    },
    {
        "namespace": "color",
        "key": "crimson-40",
        "value": "oklch(66.41% 0.2325 8.311)"
    },
    {
        "namespace": "color",
        "key": "crimson-50",
        "value": "oklch(63.55% 0.25 15.3)"
    },
    {
        "namespace": "color",
        "key": "crimson-60",
        "value": "oklch(62.66% 0.25 21.21)"
    },
    {
        "namespace": "color",
        "key": "crimson-70",
        "value": "oklch(58.59% 0.2383 26.22)"
    },
    {
        "namespace": "color",
        "key": "crimson-80",
        "value": "oklch(53.32% 0.2169 26.29)"
    },
    {
        "namespace": "color",
        "key": "crimson-90",
        "value": "oklch(44.03% 0.1783 24.44)"
    },
    {
        "namespace": "color",
        "key": "crimson-95",
        "value": "oklch(31.73% 0.1287 25.13)"
    },
    {
        "namespace": "color",
        "key": "crimson-100",
        "value": "oklch(27.68% 0.1126 26.19)"
    },
    {
        "namespace": "color",
        "key": "red-0",
        "value": "oklch(96.63% 0.0166 17.2)"
    },
    {
        "namespace": "color",
        "key": "red-5",
        "value": "oklch(94.05% 0.0299 17.02)"
    },
    {
        "namespace": "color",
        "key": "red-10",
        "value": "oklch(87.16% 0.0687 17.78)"
    },
    {
        "namespace": "color",
        "key": "red-20",
        "value": "oklch(79.39% 0.119 18.78)"
    },
    {
        "namespace": "color",
        "key": "red-30",
        "value": "oklch(72.94% 0.1679 17.49)"
    },
    {
        "namespace": "color",
        "key": "red-40",
        "value": "oklch(64.7% 0.2399 19.91)"
    },
    {
        "namespace": "color",
        "key": "red-50",
        "value": "oklch(62.82% 0.25 28.59)"
    },
    {
        "namespace": "color",
        "key": "red-60",
        "value": "oklch(60.94% 0.2501 29.23)"
    },
    {
        "namespace": "color",
        "key": "red-70",
        "value": "oklch(57.58% 0.2363 29.23)"
    },
    {
        "namespace": "color",
        "key": "red-80",
        "value": "oklch(53.09% 0.2178 29.23)"
    },
    {
        "namespace": "color",
        "key": "red-90",
        "value": "oklch(44.45% 0.1824 29.23)"
    },
    {
        "namespace": "color",
        "key": "red-95",
        "value": "oklch(32.59% 0.1337 29.23)"
    },
    {
        "namespace": "color",
        "key": "red-100",
        "value": "oklch(28.54% 0.1171 29.23)"
    },
    {
        "namespace": "color",
        "key": "ground",
        "value": "$color-grey-0",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "base",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "invert",
        "value": "$color-black",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "stone",
        "value": "$color-stone-30",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "stone-active",
        "value": "$color-stone-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "stone-text",
        "value": "$color-stone-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "gray",
        "value": "$color-gray-30",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "gray-active",
        "value": "$color-gray-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "gray-text",
        "value": "$color-gray-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "grey",
        "value": "$color-grey-30",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "grey-active",
        "value": "$color-grey-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "grey-text",
        "value": "$color-grey-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "slate",
        "value": "$color-slate-30",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "slate-active",
        "value": "$color-slate-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "slate-text",
        "value": "$color-slate-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "brown",
        "value": "$color-brown-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "brown-active",
        "value": "$color-brown-50",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "brown-text",
        "value": "$color-brown-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "orange",
        "value": "$color-orange-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "orange-active",
        "value": "$color-orange-50",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "orange-text",
        "value": "$color-orange-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "amber",
        "value": "$color-amber-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "amber-active",
        "value": "$color-amber-50",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "amber-text",
        "value": "$color-amber-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "yellow",
        "value": "$color-yellow-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "yellow-active",
        "value": "$color-yellow-50",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "yellow-text",
        "value": "$color-yellow-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "lime",
        "value": "$color-lime-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "lime-active",
        "value": "$color-lime-50",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "lime-text",
        "value": "$color-lime-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "green",
        "value": "$color-green-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "green-active",
        "value": "$color-green-50",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "green-text",
        "value": "$color-green-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "beryl",
        "value": "$color-beryl-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "beryl-active",
        "value": "$color-beryl-50",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "beryl-text",
        "value": "$color-beryl-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "teal",
        "value": "$color-teal-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "teal-active",
        "value": "$color-teal-50",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "teal-text",
        "value": "$color-teal-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "cyan",
        "value": "$color-cyan-40",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "cyan-active",
        "value": "$color-cyan-50",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "cyan-text",
        "value": "$color-cyan-90",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "sky",
        "value": "$color-sky-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "sky-active",
        "value": "$color-sky-70",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "sky-text",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "blue",
        "value": "$color-blue-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "blue-active",
        "value": "$color-blue-70",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "blue-text",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "indigo",
        "value": "$color-indigo-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "indigo-active",
        "value": "$color-indigo-70",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "indigo-text",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "violet",
        "value": "$color-violet-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "violet-active",
        "value": "$color-violet-70",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "violet-text",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "purple",
        "value": "$color-purple-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "purple-active",
        "value": "$color-purple-70",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "purple-text",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "fuchsia",
        "value": "$color-fuchsia-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "fuchsia-active",
        "value": "$color-fuchsia-70",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "fuchsia-text",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "pink",
        "value": "$color-pink-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "pink-active",
        "value": "$color-pink-70",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "pink-text",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "crimson",
        "value": "$color-crimson-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "crimson-active",
        "value": "$color-crimson-70",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "crimson-text",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "red",
        "value": "$color-red-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "red-active",
        "value": "$color-red-70",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "red-text",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color-line",
        "key": "neutral",
        "value": "$color-grey-60",
        "mode": "light"
    },
    {
        "namespace": "color-line",
        "key": "light",
        "value": "oklch(0% 0 none / 0.12)",
        "mode": "light"
    },
    {
        "namespace": "color-line",
        "key": "lighter",
        "value": "oklch(0% 0 none / 0.09)",
        "mode": "light"
    },
    {
        "namespace": "color-line",
        "key": "lightest",
        "value": "oklch(0% 0 none / 0.06)",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "invert",
        "value": "$color-white",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "strong",
        "value": "$color-grey-100",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "neutral",
        "value": "$color-grey-70",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "lightest",
        "value": "$color-grey-30",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "lighter",
        "value": "$color-grey-40",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "light",
        "value": "$color-grey-50",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "stone",
        "value": "$color-stone-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "gray",
        "value": "$color-gray-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "grey",
        "value": "$color-grey-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "slate",
        "value": "$color-slate-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "brown",
        "value": "$color-brown-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "orange",
        "value": "$color-orange-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "amber",
        "value": "$color-amber-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "yellow",
        "value": "$color-yellow-70",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "lime",
        "value": "$color-lime-70",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "green",
        "value": "$color-green-70",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "beryl",
        "value": "$color-beryl-70",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "teal",
        "value": "$color-teal-70",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "cyan",
        "value": "$color-cyan-70",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "sky",
        "value": "$color-sky-70",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "blue",
        "value": "$color-blue-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "indigo",
        "value": "$color-indigo-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "violet",
        "value": "$color-violet-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "purple",
        "value": "$color-purple-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "fuchsia",
        "value": "$color-fuchsia-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "pink",
        "value": "$color-pink-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "crimson",
        "value": "$color-crimson-60",
        "mode": "light"
    },
    {
        "namespace": "color-text",
        "key": "red",
        "value": "$color-red-60",
        "mode": "light"
    },
    {
        "namespace": "color",
        "key": "ground",
        "value": "$color-gray-100",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "base",
        "value": "$color-gray-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "invert",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "stone",
        "value": "$color-stone-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "stone-active",
        "value": "$color-stone-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "stone-text",
        "value": "$color-stone-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "gray",
        "value": "$color-gray-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "gray-active",
        "value": "$color-gray-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "gray-text",
        "value": "$color-gray-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "grey",
        "value": "$color-grey-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "grey-active",
        "value": "$color-grey-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "grey-text",
        "value": "$color-grey-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "slate",
        "value": "$color-slate-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "slate-active",
        "value": "$color-slate-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "slate-text",
        "value": "$color-slate-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "brown",
        "value": "$color-brown-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "brown-active",
        "value": "$color-brown-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "brown-text",
        "value": "$color-brown-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "orange",
        "value": "$color-orange-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "orange-active",
        "value": "$color-orange-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "orange-text",
        "value": "$color-orange-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "amber",
        "value": "$color-amber-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "amber-active",
        "value": "$color-amber-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "amber-text",
        "value": "$color-amber-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "yellow",
        "value": "$color-yellow-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "yellow-active",
        "value": "$color-yellow-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "yellow-text",
        "value": "$color-yellow-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "lime",
        "value": "$color-lime-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "lime-active",
        "value": "$color-lime-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "lime-text",
        "value": "$color-lime-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "green",
        "value": "$color-green-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "green-active",
        "value": "$color-green-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "green-text",
        "value": "$color-green-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "beryl",
        "value": "$color-beryl-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "beryl-active",
        "value": "$color-beryl-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "beryl-text",
        "value": "$color-beryl-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "teal",
        "value": "$color-teal-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "teal-active",
        "value": "$color-teal-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "teal-text",
        "value": "$color-teal-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "cyan",
        "value": "$color-cyan-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "cyan-active",
        "value": "$color-cyan-30",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "cyan-text",
        "value": "$color-cyan-95",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "sky",
        "value": "$color-sky-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "sky-active",
        "value": "$color-sky-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "sky-text",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "blue",
        "value": "$color-blue-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "blue-active",
        "value": "$color-blue-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "blue-text",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "indigo",
        "value": "$color-indigo-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "indigo-active",
        "value": "$color-indigo-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "indigo-text",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "violet",
        "value": "$color-violet-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "violet-active",
        "value": "$color-violet-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "violet-text",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "purple",
        "value": "$color-purple-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "purple-active",
        "value": "$color-purple-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "purple-text",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "fuchsia",
        "value": "$color-fuchsia-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "fuchsia-active",
        "value": "$color-fuchsia-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "fuchsia-text",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "pink",
        "value": "$color-pink-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "pink-active",
        "value": "$color-pink-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "pink-text",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "crimson",
        "value": "$color-crimson-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "crimson-active",
        "value": "$color-crimson-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "crimson-text",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "red",
        "value": "$color-red-50",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "red-active",
        "value": "$color-red-40",
        "mode": "dark"
    },
    {
        "namespace": "color",
        "key": "red-text",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color-line",
        "key": "neutral",
        "value": "$color-gray-30",
        "mode": "dark"
    },
    {
        "namespace": "color-line",
        "key": "light",
        "value": "oklch(100% 0 none / 0.12)",
        "mode": "dark"
    },
    {
        "namespace": "color-line",
        "key": "lighter",
        "value": "oklch(100% 0 none / 0.09)",
        "mode": "dark"
    },
    {
        "namespace": "color-line",
        "key": "lightest",
        "value": "oklch(100% 0 none / 0.06)",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "invert",
        "value": "$color-black",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "strong",
        "value": "$color-white",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "neutral",
        "value": "$color-gray-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "lightest",
        "value": "$color-gray-60",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "lighter",
        "value": "$color-gray-50",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "light",
        "value": "$color-gray-40",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "stone",
        "value": "$color-stone-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "gray",
        "value": "$color-gray-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "grey",
        "value": "$color-grey-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "slate",
        "value": "$color-slate-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "brown",
        "value": "$color-brown-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "orange",
        "value": "$color-orange-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "amber",
        "value": "$color-amber-40",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "yellow",
        "value": "$color-yellow-40",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "lime",
        "value": "$color-lime-40",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "green",
        "value": "$color-green-40",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "beryl",
        "value": "$color-beryl-40",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "teal",
        "value": "$color-teal-40",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "cyan",
        "value": "$color-cyan-40",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "sky",
        "value": "$color-sky-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "blue",
        "value": "$color-blue-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "indigo",
        "value": "$color-indigo-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "violet",
        "value": "$color-violet-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "purple",
        "value": "$color-purple-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "fuchsia",
        "value": "$color-fuchsia-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "pink",
        "value": "$color-pink-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "crimson",
        "value": "$color-crimson-30",
        "mode": "dark"
    },
    {
        "namespace": "color-text",
        "key": "red",
        "value": "$color-red-30",
        "mode": "dark"
    },
    {
        "namespace": "screen",
        "key": "4xs",
        "value": 360
    },
    {
        "namespace": "screen",
        "key": "3xs",
        "value": 480
    },
    {
        "namespace": "screen",
        "key": "2xs",
        "value": 600
    },
    {
        "namespace": "screen",
        "key": "xs",
        "value": 768
    },
    {
        "namespace": "screen",
        "key": "sm",
        "value": 834
    },
    {
        "namespace": "screen",
        "key": "md",
        "value": 1024
    },
    {
        "namespace": "screen",
        "key": "lg",
        "value": 1280
    },
    {
        "namespace": "screen",
        "key": "xl",
        "value": 1440
    },
    {
        "namespace": "screen",
        "key": "2xl",
        "value": 1600
    },
    {
        "namespace": "screen",
        "key": "3xl",
        "value": 1920
    },
    {
        "namespace": "screen",
        "key": "4xl",
        "value": 2560
    }
] satisfies VariableDefinitions

export const modes = [
    "light",
    "dark"
] satisfies string[]

export const screens = {
    "4xs": 360,
    "3xs": 480,
    "2xs": 600,
    "xs": 768,
    "sm": 834,
    "md": 1024,
    "lg": 1280,
    "xl": 1440,
    "2xl": 1600,
    "3xl": 1920,
    "4xl": 2560
} satisfies Record<string, number>

export default variables
