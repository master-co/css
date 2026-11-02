import type { IllustrationImages } from './document-types'
import runtimeLight from '../assets/images/rendering-modes/runtime-light.png'
import runtimeDark from '../assets/images/rendering-modes/runtime-dark.png'
import progressiveLight from '../assets/images/rendering-modes/progressive-light.png'
import progressiveDark from '../assets/images/rendering-modes/progressive-dark.png'
import hydrationLight from '../assets/images/rendering-modes/hydration-light.png'
import hydrationDark from '../assets/images/rendering-modes/hydration-dark.png'
import scanningLight from '../assets/images/rendering-modes/scanning-light.png'
import scanningDark from '../assets/images/rendering-modes/scanning-dark.png'

import pruningLight from '../assets/images/rendering-modes/pruning-light.png'
import pruningDark from '../assets/images/rendering-modes/pruning-dark.png'
import pruningScopeLight from '../assets/images/rendering-modes/pruning-scope-light.png'
import pruningScopeDark from '../assets/images/rendering-modes/pruning-scope-dark.png'
import routeLight from '../assets/images/rendering-modes/route-light.png'
import routeDark from '../assets/images/rendering-modes/route-dark.png'
import nextjsLight from '../assets/images/rendering-modes/nextjs-light.png'
import nextjsDark from '../assets/images/rendering-modes/nextjs-dark.png'

export const deliveryIllustrationImages = {
  scanning: { light: scanningLight, dark: scanningDark },
  pruning: { light: pruningLight, dark: pruningDark },
  'pruning-scope': { light: pruningScopeLight, dark: pruningScopeDark },
  route: { light: routeLight, dark: routeDark },
  nextjs: { light: nextjsLight, dark: nextjsDark },
  runtime: { light: runtimeLight, dark: runtimeDark },
  progressive: { light: progressiveLight, dark: progressiveDark },
  hydration: { light: hydrationLight, dark: hydrationDark }
} satisfies Record<string, IllustrationImages>
