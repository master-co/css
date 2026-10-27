import type { ColorPresentationParams } from 'vscode-languageserver-protocol'
import type { MasterCSSLanguageColorFormat } from '@master/css-tooling/language'
import Color from 'colorjs.io'

const colorJsSpaces: Readonly<Record<string, string>> = {
  'rgb': 'srgb',
  'display-p3': 'p3',
  'a98-rgb': 'a98rgb',
  'prophoto-rgb': 'prophoto',
  'xyz': 'xyz-d65'
}

export function convertColorInFormat(
  color: ColorPresentationParams['color'],
  format: MasterCSSLanguageColorFormat
) {
  const source = new Color({
    space: 'srgb',
    coords: [color.red, color.green, color.blue],
    alpha: color.alpha
  })
  const token = format.syntax === 'hex'
    ? `#${[color.red, color.green, color.blue, ...(color.alpha < 1 ? [color.alpha] : [])]
        .map((channel) => Math.round(Math.min(1, Math.max(0, channel)) * 255)
          .toString(16)
          .padStart(2, '0'))
        .join('')}`
    : source
        .to(colorJsSpaces[format.space || format.syntax] || format.space || format.syntax)
        .toString({ format: 'css', precision: 4, inGamut: false })
  return token
    .replace(' / ', '/')
    .replaceAll(' ', '|')
}
