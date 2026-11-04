import preset from '@master/internal-site/css/preset-manifest.ts'
import { generatePresetClasses } from '@master/internal-site/css/preset-css.ts'
import { referenceLabel } from './ui.ts'

/** The preset owns class names; Rust supplies the expanded declaration facts. */
const utilities = preset.utilities!
  .filter(utility => utility.kind === 'static' && utility.body.length === 1 && utility.body[0].type === 'declaration')

export const fixedUtilityRows = generatePresetClasses(utilities.map(utility => utility.name)).classes.map((result, index) => {
  const body = utilities[index].body[0]
  const declaration = body.type === 'declaration' ? result.declarations?.filter(item => item.property === body.property) : []
  if (result.matchStatus !== 'matched' || declaration?.length !== 1) {
    throw new Error(`Expected one preset declaration for ${result.className}`)
  }
  // Compatibility declarations may accompany the preset's one authored property.
  const { property, value } = declaration[0]
  return { className: result.className, property, value, declaration: `${property}: ${value}` }
})

export function fixedUtilitiesMarkdown(locale = 'en') {
  return [
    `| ${referenceLabel(locale, 'class')} | ${referenceLabel(locale, 'declarations')} |`,
    '| --- | --- |',
    ...fixedUtilityRows.map(row => `| \`${row.className}\` | \`${row.declaration}\` |`)
  ].join('\n')
}
