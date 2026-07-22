import Color from 'colorjs.io'
import type { ColorInformation } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type CSSLanguageService from '../core'

export default async function renderSyntaxColors(
  this: CSSLanguageService,
  document: TextDocument
): Promise<ColorInformation[]> {
  const candidates = this.getClassPositions(document).map(({ token, range }) => ({
    className: token,
    start: range.start
  }))
  const colors: ColorInformation[] = []
  for (const token of this.session.colorTokens(candidates).tokens) {
    try {
      const color = new Color(token.value)
      if (token.alpha !== undefined) color.alpha *= token.alpha
      const srgb = color.to('srgb')
      colors.push({
        range: {
          start: document.positionAt(token.range.start),
          end: document.positionAt(token.range.end)
        },
        color: {
          red: srgb.r ?? 0,
          green: srgb.g ?? 0,
          blue: srgb.b ?? 0,
          alpha: Number(srgb.alpha)
        }
      })
    } catch { }
  }
  return colors
}
