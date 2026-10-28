import { getThemeVariables } from '~/site/utils/theme-variables'

export const documentValueExamples = [
  ['duration', 'fast'], ['color-surface', 'raised'], ['easing', 'smooth'],
].map(([namespace, key]) => {
  const token = getThemeVariables(namespace).find(token => token.key === key)
  if (!token) throw new Error(`Missing document example token: ${namespace}-${key}`)
  return { id: `catalog-${namespace}-${key}`, title: key, identifier: `--${namespace}-${key}`, values: [{ label: 'Default', value: token.value }] }
})
