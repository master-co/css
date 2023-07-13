import { extend } from '@techor/extend'
import defaultOptions, { Options, ThemeValue } from './options'

export class ThemeService {

    // 按照系統的主題切換，目前只支援 light dark
    private _darkMQL: MediaQueryList = typeof matchMedia !== 'undefined' ? matchMedia?.('(prefers-color-scheme:dark)') : undefined
    private _value: ThemeValue
    private _current: string
    public initialized = false

    constructor(
        public options?: Options,
        public host = typeof document !== 'undefined' ? document.documentElement : null
    ) {
        this.options = options ? extend(defaultOptions, options) : defaultOptions
    }

    init() {
        let value = this.options.default
        const storage = this.storage
        if (storage) {
            value = storage
        }
        this.value = value
        this.initialized = true
    }

    get storage() {
        const { store } = this.options
        if (typeof localStorage !== 'undefined' && store) {
            return localStorage.getItem(store)
        }
    }

    get systemCurrent(): string {
        return this._darkMQL.matches ? 'dark' : 'light'
    }

    set value(value: ThemeValue) {
        if (value === 'system') {
            this._darkMQL?.addEventListener?.('change', this._onThemeChange)
            this.current = this.systemCurrent
        } else {
            this._removeDarkMQLListener()
            this.current = value
        }
        if (value !== this._value) {
            this.host.dispatchEvent(new CustomEvent('themeChange', { detail: this }))
            this._value = value
        }
    }

    get value() {
        return this._value
    }

    set current(current: string) {
        const previous = this._current
        this._current = current
        if (this.host && previous !== current) {
            if (previous)
                this.host.classList.remove(previous)
            if (current && !this.host.classList.contains(current)) {
                this.host.classList.add(current)
                if ((this.host as any).style) {
                    (this.host as any).style.colorScheme =
                        (current === 'dark' || current === 'light') ? current : null
                }
            }
        }
    }

    get current() {
        return this._current
    }

    switch(value: ThemeValue) {
        if (value && value !== this.value) {
            this.value = value
            // 儲存 theme 到 localStorage
            if (typeof localStorage !== 'undefined' && this.storage !== value && this.options.store) {
                localStorage.setItem(this.options.store, value)
            }
        }
    }

    private _removeDarkMQLListener() {
        this._darkMQL?.removeEventListener('change', this._onThemeChange)
    }

    private _onThemeChange = (mediaQueryList: MediaQueryListEvent) => {
        this.current = mediaQueryList.matches ? 'dark' : 'light'
    }

    destroy(complete = true) {
        this._removeDarkMQLListener()
        if (this.host) {
            this.host.style.colorScheme = null
            this.host.classList.remove(this.current)
        }
        if (complete && typeof localStorage !== 'undefined' && this.options.store) {
            localStorage.removeItem(this.options.store)
        }
        this._current = null
        this._value = null
        this.initialized = false
    }
}

declare global {
    interface Window {
        ThemeService: typeof ThemeService
    }
}