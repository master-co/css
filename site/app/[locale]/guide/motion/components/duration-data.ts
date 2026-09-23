import { getThemeVariables } from '~/site/utils/theme-variables'

const durationDescriptions: Record<string, string> = {
  fastest: 'Micro feedback such as pressed states and tiny affordances.',
  faster: 'Quick exits, icon feedback, and very short state changes.',
  fast: 'Popovers, fades, short entrances, and hover feedback.',
  normal: 'Default interaction transitions when no stronger rhythm is needed.',
  slow: 'Standard UI movement and visible state changes.',
  slower: 'Panels, drawers, and larger reveals.',
  slowest: 'Ambient or emphasized motion that should be used sparingly.'
}

export function getDurationRows() {
  return getThemeVariables('duration').map(({ key, name, value }) => ({
    token: `--${name}`, utilities: [`animation-duration:${key}`], value: String(value),
    description: durationDescriptions[key]
  }))
}
