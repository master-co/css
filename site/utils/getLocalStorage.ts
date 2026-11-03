import { isBrowser } from './isBrowser';

export function getLocalStorage(key: string) {
    if (isBrowser) {
        return localStorage.getItem(key);
    }
}