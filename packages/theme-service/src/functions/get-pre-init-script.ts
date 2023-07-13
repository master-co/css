import defaultOptions, { Options } from '../options'

export default function getPreInitScript(options?: Options) {
    options = Object.assign(defaultOptions, options)
    return `let e${options.default ? `='${options.default}'` : ''};const c=localStorage.getItem("${options.store}");c&&(e=c);let t=e;e==="system"&&(t=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");const s=document.documentElement;s.classList.add(t);if(t==='dark'||t==='light'){s.style.colorScheme=t;};`
}

// 原始碼參考
// export function getPreInitScript(options: Options = { store: 'theme' }) {
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
//         if (current === 'dark' || current === 'light') {
//             host.style.colorScheme = current;
//         }
//     `
// }