export function getSyncWithStoredThemeScript(store = 'theme') {
    return `let storage=localStorage.getItem("${store}");if("system"===storage&&(storage=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")||storage){const a=document.documentElement;a.classList.add(storage),a.style.colorScheme=storage}`
}