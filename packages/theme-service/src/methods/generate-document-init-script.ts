import { Options } from '../options'

export function generateDocumentInitScript(options?: Options) {
    options = Object.assign({ store: 'theme' }, options)
    return `let e${options.default ? `='${options.default}'` : ''};const c=localStorage.getItem("${options.store}");c&&(e=c);let t=e;e==="system"&&(t=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");const s=document.documentElement;s.classList.add(t);s.style.colorScheme=t;`
}

// 原始碼參考
// export function getDocThemeInitScript(options: Options = { store: 'theme' }) {
//     return `
//         let value = ${options.default};
//         ${options.store ? `
//             const storage = localStorage.getItem('${options.store}');
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