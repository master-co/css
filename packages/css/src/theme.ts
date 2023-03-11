import extend from 'to-extend'

export declare interface ThemeSettings {
    default?: ThemeValue
    store?: string | false
    init?: boolean
}

export const themeSettings: ThemeSettings = {
    store: 'theme',
    init: true
}

export declare type ThemeValue = 'dark' | 'light' | 'system' | string

const hasDocument = typeof document !== 'undefined'
const hasLocalStorage = typeof localStorage !== 'undefined'

export class Theme {

    // 按照系統的主題切換，目前只支援 light dark
    private _darkMQL: MediaQueryList = typeof matchMedia !== 'undefined' ? matchMedia?.('(prefers-color-scheme:dark)') : undefined
    private _value: ThemeValue
    private _current: string

    constructor(
        public settings?: ThemeSettings,
        public host = hasDocument ? document.documentElement : null
    ) {
        this.settings = settings ? extend(themeSettings, settings) : themeSettings
        if (this.settings.init) {
            this.init()
        }
    }

    init() {
        let value = this.settings.default
        const storage = this.storage
        if (storage) {
            value = storage
        }
        this.value = value
    }

    get storage() {
        const { store } = this.settings
        if (hasLocalStorage && store) {
            return localStorage.getItem(store)
        }
    }

    get systemValue(): string {
        return this._darkMQL.matches ? 'dark' : 'light'
    }

    set value(value: ThemeValue) {
        this._value = value
        if (value === 'system') {
            this._darkMQL?.addEventListener?.('change', this._onThemeChange)
            this.current = this.systemValue
        } else {
            this._removeDarkMQLListener()
            this.current = value
        }
    }

    get value() {
        return this._value
    }

    set current(current: string) {
        const previous = this._current
        this._current = current
        if (this.host) {
            if (previous)
                this.host.classList.remove(previous)
            if (!this.host.classList.contains(current)) {
                this.host.classList.add(current)
                if ((this.host as any).style) {
                    (this.host as any).style.colorScheme = current
                }
            }
        }
    }

    get current() {
        return this._current
    }

    switch(value: ThemeValue, settings: { store?: boolean, emit?: boolean } = { store: true, emit: true }) {
        if (value && value !== this.value) {
            this.value = value
            // 儲存 theme 到 localStorage
            if (hasLocalStorage && this.storage !== value && this.settings.store) {
                localStorage.setItem(this.settings.store, value)
            }
            if (settings.emit) {
                this.host.dispatchEvent(new CustomEvent('theme', { detail: this }))
            }
        }
    }

    private _removeDarkMQLListener() {
        this._darkMQL?.removeEventListener('change', this._onThemeChange)
    }

    private _onThemeChange = (mediaQueryList: MediaQueryListEvent) => {
        this.current = mediaQueryList.matches ? 'dark' : 'light'
    }

    destroy() {
        this._removeDarkMQLListener()
    }
}

export function getDocThemeInitScript(settings?: ThemeSettings) {
    settings = Object.assign({ store: 'theme' }, settings)
    return `let e${settings.default ? `='${settings.default}'` : ''};const c=localStorage.getItem("${settings.store}");c&&(e=c);let t=e;e==="system"&&(t=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");const s=document.documentElement;s.classList.add(t);s.style.colorScheme=t;`
}

// 原始碼參考
// export function getDocThemeInitScript(settings: ThemeSettings = { store: 'theme' }) {
//     return `
//         let value = ${settings.default};
//         ${settings.store ? `
//             const storage = localStorage.getItem('${settings.store}');
//             if (storage) {
//                 value = storage;
//             }
//         ` : ''}
//         let current = value;
//         if (value === 'system') {
//             current = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
//         };
//         const host = document.documentElement;
//         host.classList.add(current);
//         host.style.colorScheme = current;
//     `
// }