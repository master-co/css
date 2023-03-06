import { MasterCSS } from './css'

const isBrowser = typeof window !== 'undefined'

if (isBrowser) {
    Object.assign(window, {
        MasterCSS,
    })
}