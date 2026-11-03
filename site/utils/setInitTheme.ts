import { isBrowser } from './isBrowser';

export function setInitTheme() {
    if (isBrowser) {
        document.documentElement.classList.add(localStorage.getItem('theme') || 'dark');
    }
}