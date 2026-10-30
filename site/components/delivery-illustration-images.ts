import type { IllustrationImages } from './DocumentIllustration'
import runtimeLight from '../assets/images/rendering-modes/runtime-light.png'
import runtimeDark from '../assets/images/rendering-modes/runtime-dark.png'
import progressiveLight from '../assets/images/rendering-modes/progressive-light.png'
import progressiveDark from '../assets/images/rendering-modes/progressive-dark.png'
import hydrationLight from '../assets/images/rendering-modes/hydration-light.png'
import hydrationDark from '../assets/images/rendering-modes/hydration-dark.png'

export const deliveryIllustrationImages = {
  runtime: { light: runtimeLight, dark: runtimeDark },
  progressive: { light: progressiveLight, dark: progressiveDark },
  hydration: { light: hydrationLight, dark: hydrationDark }
} satisfies Record<string, IllustrationImages>
