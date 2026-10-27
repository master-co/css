import { foundationScene, specimenCaption, specimenTokens, tokenAdvice } from './specimens'
import { configuredMarkupMarkdown } from '../../reference/configured-example'

export function specimenFactsMarkdown(namespace: string, keys?: string[]) {
  return specimenTokens(namespace, keys).map(token => `- \`--${token.name}\`: ${token.values.map(value => `\`${value.value}\` (${value.path.join(' → ')})`).join('; ')}${tokenAdvice(namespace, token.key) ? ` — ${tokenAdvice(namespace, token.key)}` : ''}`).join('\n')
}
export function selectedSpecimensMarkdown(namespace: string, keys: string[]) {
  const scene = foundationScene(namespace, keys)
  return `${specimenCaption[namespace]}\n\n${specimenFactsMarkdown(namespace, keys)}${scene.html && namespace !== 'color' ? `\n\n${configuredMarkupMarkdown(scene.css ?? '', scene.html)}` : ''}`
}
