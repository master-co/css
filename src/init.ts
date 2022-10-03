import { breakpoints, colors, MasterCSS, MasterCSSRule, Rules } from './';

const isBrowser = typeof window !== 'undefined';

export function init() {
    if (isBrowser) {
        const css = new MasterCSS(document.head);
        MasterCSS.root = css;
        css.observe(document.documentElement);
    }
}

// MasterCSSRule
//     .extend('colors', colors)
//     .extend('breakpoints', breakpoints);
// MasterCSS.Rules.push(...Rules);

const MASTER_CSS = 'MasterCSS';
if (isBrowser) {
    window['init' + MASTER_CSS] = init;
    window['MasterCSSRules'] = Rules;
    if (!window[MASTER_CSS + 'Manual']) {
        init();
    }
}

declare global {
    interface Window {
        MasterCSSManual: boolean;
    }
}
