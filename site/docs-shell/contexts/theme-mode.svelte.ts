import { onMount } from 'svelte'
import ThemeMode from 'theme-mode'

export type ThemePreference = 'light' | 'dark' | 'system' | (string & {})

interface ThemeModeSnapshot {
  preference?: ThemePreference
  value?: string
}

/** Empty until a component mounts, as on the server, so hydration matches the server's markup. */
const snapshot = $state<ThemeModeSnapshot>({})
let themeMode: ThemeMode | undefined

/** One page-wide ThemeMode so every island shows and changes the same preference. */
function getThemeMode() {
  themeMode ??= new ThemeMode({ preference: 'system' }).init()
  return themeMode
}

/**
 * A theme swap recolors the whole page at once. Without pausing transitions, every element would fade or slide
 * to its new colors on its own timing, so the swap commits with transitions off and restores them a frame later.
 */
function withoutTransitions(change: () => void) {
  const style = document.createElement('style')
  style.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.append(style)
  change()
  void document.body.offsetHeight
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()))
}

/** The page's theme preference and resolved mode; call during component initialization. */
export function useThemeMode() {
  onMount(() => {
    const instance = getThemeMode()
    const update = () => {
      snapshot.preference = instance.preference
      snapshot.value = instance.value
    }
    update()
    document.documentElement.addEventListener('themeModeChange', update)
    document.documentElement.addEventListener('themePreferenceChange', update)
    return () => {
      document.documentElement.removeEventListener('themeModeChange', update)
      document.documentElement.removeEventListener('themePreferenceChange', update)
    }
  })
  return {
    get value() {
      return snapshot.value
    },
    set preference(preference: ThemePreference | undefined) {
      if (preference) withoutTransitions(() => { getThemeMode().preference = preference })
    },
    get preference() {
      return snapshot.preference
    }
  }
}
