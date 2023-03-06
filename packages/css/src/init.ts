import { MasterCSS } from './css'

const isBrowser = typeof window !== 'undefined';

/* @__PURE__ */
(() => {
    if (isBrowser) {
        Object.assign(window, {
            MasterCSS,
        })
    }
})()

declare global {
    interface Window {
        MasterCSS: typeof MasterCSS;
    }
}