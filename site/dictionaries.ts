const dictionaries: Record<string, () => Promise<any>> = {
  en: () => import('./public/dictionaries/en.json').then((module) => module.default),
  tw: () => import('./public/dictionaries/tw.json').then((module) => module.default),
  ja: () => import('./public/dictionaries/ja.json').then((module) => module.default),
  ko: () => import('./public/dictionaries/ko.json').then((module) => module.default),
  cn: () => import('./public/dictionaries/cn.json').then((module) => module.default),
}

export default dictionaries
