import type { ColorPresentationParams } from 'vscode-languageserver-protocol'
import Color from 'colorjs.io'

export function convertColorInSpace(
  color: ColorPresentationParams['color'],
  outputSpace: string
) {
  return new Color({ space: 'srgb', coords: [color.red, color.green, color.blue], alpha: color.alpha }).to(outputSpace).toString({ format: 'css', precision: 4, inGamut: false })
    .replace(' / ', '/')
    .replaceAll(' ', '|')
}
