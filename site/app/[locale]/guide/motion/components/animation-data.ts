import { getThemeVariables } from '~/site/utils/theme-variables'

const animationDescriptions: Record<string, string> = {
  fade: 'Opacity rises from 0 to 1, then the cycle starts again.',
  flash: 'Opacity falls to 0 twice per cycle. Avoid flashing in ordinary UI.',
  float: 'Moves up 1.25rem and returns over a three-second cycle.',
  heart: 'Two scale pulses, each reaching 1.3 times the original size.',
  jump: 'Bounces between its starting position and a quarter-height upward offset.',
  ping: 'Expands to twice its size while fading out.',
  pulse: 'Scales to 1.05 times its size and returns.',
  rotate: 'Completes one full turn per second at a constant rate.',
  shake: 'Alternates horizontal offsets and Y-axis rotations, then settles.',
  zoom: 'Scales from 0 to its original size, then starts again.'
}

export function getAnimationRows() {
  return getThemeVariables('animate').map(({ key, name, value }) => ({
    token: `--${name}`, utilities: [`animate-${key}`], value: String(value),
    description: animationDescriptions[key]
  }))
}
