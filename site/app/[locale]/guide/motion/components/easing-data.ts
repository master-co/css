import { getThemeVariables } from '~/site/utils/theme-variables'

const easingDescriptions: Record<string, string> = {
  smooth: 'Balanced movement for common UI transitions.',
  soft: 'Gentle reveals and quiet fades.',
  crisp: 'Quick feedback with a polished finish.',
  snap: 'Firm settling for compact controls.',
  accelerate: 'Exits or elements leaving the screen.',
  decelerate: 'Entrances or elements arriving on screen.',
  overshoot: 'Playful scale or position emphasis.',
  rewind: 'Pulled-back exits and reversals.',
  spring: 'Expressive emphasis; use sparingly.'
}

export function getEasingRows() {
  return getThemeVariables('easing').map(({ key, name, value }) => ({
    token: `--${name}`, utilities: [`animation-timing-function:${key}`], value: String(value),
    description: easingDescriptions[key]
  }))
}
