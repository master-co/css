import Color from 'colorjs.io'
import type { ColorInformation } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { MasterCSSLanguageService } from '../core'

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
      const color = new Color(token.value)
      if (token.alpha !== undefined) color.alpha *= token.alpha
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
