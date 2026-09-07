import Color from 'colorjs.io'
import type { ColorInformation } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { MasterCSSLanguageColorExpression } from '@master/css-tooling/language'
import type { MasterCSSLanguageService } from '../core'

const colorJsSpaces: Readonly<Record<string, string>> = {
  'display-p3': 'p3',
  'a98-rgb': 'a98rgb',
  'prophoto-rgb': 'prophoto',
  'xyz': 'xyz-d65'
}

function evaluateColorExpression(expression: MasterCSSLanguageColorExpression): Color {
  if (expression.kind === 'literal') {
    const color = new Color(expression.value)
    if (expression.alpha !== undefined) color.alpha *= expression.alpha
    return color
  }
  const color = Color.mix(
    evaluateColorExpression(expression.left),
    evaluateColorExpression(expression.right),
    expression.progress,
    {
      space: colorJsSpaces[expression.space] || expression.space,
      premultiplied: true,
      hue: expression.hue as 'shorter' | 'longer' | 'increasing' | 'decreasing' | undefined
    }
  )
  color.alpha *= expression.alphaMultiplier
  return color
}

export default async function renderSyntaxColors(
  this: MasterCSSLanguageService,
  document: TextDocument
): Promise<ColorInformation[]> {
  const candidates = this.getClassPositions(document).map(({ token, range }) => ({
    className: token,
    start: range.start
  }))
  const colors: ColorInformation[] = []
  for (const token of this.session.colorTokens(candidates).tokens) {
    try {
      const color = evaluateColorExpression(token.expression)
      const srgb = color.to('srgb')
      const clamp = (value: number) => Number.isFinite(value)
        ? Math.min(1, Math.max(0, value))
        : 0
      colors.push({
        range: {
          start: document.positionAt(token.range.start),
          end: document.positionAt(token.range.end)
        },
        color: {
          red: clamp(srgb.r ?? 0),
          green: clamp(srgb.g ?? 0),
          blue: clamp(srgb.b ?? 0),
          alpha: clamp(Number(srgb.alpha))
        }
      })
    } catch { }
  }
  return colors
}
