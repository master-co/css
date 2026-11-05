import sharedTranslations from '@master/internal-site/common/translations.js'
import en from '../public/dictionaries/en.json' with { type: 'json' }
import tw from '../public/dictionaries/tw.json' with { type: 'json' }
import ja from '../public/dictionaries/ja.json' with { type: 'json' }
import ko from '../public/dictionaries/ko.json' with { type: 'json' }
import cn from '../public/dictionaries/cn.json' with { type: 'json' }

const productTranslations: Record<string, Record<string, string>> = { en, tw, ja, ko, cn }

/** Server-side adapters use the same short interface copy as the rendered page. */
export function translateSite(locale: string, text: string) {
  return productTranslations[locale]?.[text] ?? sharedTranslations[locale]?.[text] ?? text
}
