/* eslint-disable quotes */
import colors from '@master/colors'
import type { VariableDefinitions } from '../types/config'

const variables = {
    'full': '100%',
    'fit': 'fit-content',
    'max': 'max-content',
    'min': 'min-content',
    'font-family': {
        'sans': '"Inter", $font-family-sans-fallback',
        'serif': '$font-family-serif-fallback',
        'mono': '$font-family-mono-fallback',
        'sans-fallback': "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
        'serif-fallback': "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
        'mono-fallback': "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    'letter-spacing': {
        'tightest': '-0.072em',
        'tighter': '-0.04em',
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.02em',
        'wider': '0.04em',
        'widest': '0.12em',
    },
    'line-height': {
        'xs': 1.2,
        'sm': 1.4,
        'md': 1.6,
        'lg': 1.8,
        'xl': 2,
    },
    'font-weight': {
        'thin': 100,
        'extralight': 200,
        'light': 300,
        'regular': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
        'extrabold': 800,
        'heavy': 900
    },
    "font-size": {
        "3xs": 8,
        "2xs": 10,
        "xs": 12,
        "sm": 14,
        "md": 16,
        "lg": 18,
        "xl": 20,
        "2xl": 24,
        "3xl": 32,
        "4xl": 36,
        "5xl": 40,
        "6xl": 48,
        "7xl": 60,
        "8xl": 72,
        "9xl": 96,
        "10xl": 128
    },
    'border-radius': {
        "xs": 2,
        "sm": 4,
        "md": 6,
        "lg": 8,
        "xl": 12,
        "2xl": 16,
        "3xl": 24,
        "4xl": 32,
    },
    'order': {
        'first': -999999,
        'last': 999999
    },
    'spacing': {
        "4xs": 2,
        "3xs": 4,
        "2xs": 6,
        "xs": 8,
        "sm": 12,
        "md": 16,
        "lg": 24,
        "xl": 32,
        "2xl": 48,
        "3xl": 64,
        "4xl": 96,
        "5xl": 128
    },
    'color': {
        'current': 'currentColor',
        'white': 'oklch(100% 0 none)',
        'black': 'oklch(0% 0 none)',
        ...colors
    }
} satisfies VariableDefinitions

export default variables
