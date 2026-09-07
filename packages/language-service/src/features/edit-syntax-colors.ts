import type { TextDocument } from 'vscode-languageserver-textdocument'
import { MasterCSSLanguageService } from '../core'
import type { ColorPresentationParams, ColorPresentation } from 'vscode-languageserver-protocol'
import type { MasterCSSLanguageColorFormat } from '@master/css-tooling/language'
import { convertColorInFormat } from '../utils/convert-color-token'

const commonFormats: readonly MasterCSSLanguageColorFormat[] = [
  { syntax: 'hex' },
  { syntax: 'rgb' },
  { syntax: 'hsl' },
  { syntax: 'oklch' }
]

export default function editSyntaxColors(
  this: MasterCSSLanguageService,
  document: TextDocument,
  color: ColorPresentationParams['color'],
  range: ColorPresentationParams['range']
) {
  const selectedColorToken = document.getText(range)
  const rustPresentation = this.session.colorPresentation(selectedColorToken)
  const formats = rustPresentation.sourceFormat
    ? [rustPresentation.sourceFormat, ...commonFormats]
    : [...commonFormats]
  const colorPresentations: ColorPresentation[] = []
  const formatKeys = new Set<string>()
  const tokens = new Set<string>()
  for (const format of formats) {
    const formatKey = `${format.syntax}:${format.space || ''}`
    if (formatKeys.has(formatKey)) continue
    formatKeys.add(formatKey)
    try {
      const targetColorToken = convertColorInFormat(color, format)
      if (tokens.has(targetColorToken)) continue
      tokens.add(targetColorToken)
      colorPresentations.push({
        label: targetColorToken,
        textEdit: { range, newText: targetColorToken }
      })
    } catch { }
  }
  return colorPresentations
}
