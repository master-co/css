const dictionaries: Record<string, () => Promise<any>> = {
    en: () => import('./public/dictionaries/en.json').then((module) => module.default),
    tw: () => import('./public/dictionaries/tw.json').then((module) => module.default),
}

export default dictionaries