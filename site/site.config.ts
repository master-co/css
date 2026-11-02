import { defineSite } from '@master/internal-site/config'
import i18n from '@master/internal-site/common/i18n.config.js'
import units from './units'
import en from './public/dictionaries/en.json' with { type: 'json' }
import tw from './public/dictionaries/tw.json' with { type: 'json' }
import { readPublicEnv } from './utils/public-env.js'

const publicEnv = readPublicEnv()

export default defineSite({
  id: 'css',
  name: 'Master CSS',
  origin: publicEnv.PUBLIC_URL,
  content: new URL('./content/', import.meta.url),
  app: new URL('./app-config.ts', import.meta.url),
  highlighter: new URL('./adapters/highlight.ts', import.meta.url),
  i18n: { ...i18n, localizablePathnameRoots: Object.keys(units), translations: { en, tw }, sectionLocales: { examples: ['en'] } },
  sections: Object.fromEntries([
    ['home', 'home'], ['guide', 'guide'], ['reference', 'reference'],
    ['benchmarks', 'page'], ['page', 'page'],
    ['examples', 'examples'],
  ].map(([name, section]) => [name, section === 'reference' ? new URL(`./sections/${section}.astro`, import.meta.url) : new URL(import.meta.resolve(`@master/internal-site/sections/${section}.astro`))])),
  navigation: { guide: new URL('./.categories/guide.json', import.meta.url) },
  documents: { guide: { layout: new URL('./layouts/Doc.astro', import.meta.url), dictionaries: new URL('./dictionaries.ts', import.meta.url), categories: new URL('./.categories/guide.json', import.meta.url) } },
  styles: {
    site: new URL('./styles/site.ts', import.meta.url),
    interface: new URL('./styles/interface.ts', import.meta.url),
  },
})
