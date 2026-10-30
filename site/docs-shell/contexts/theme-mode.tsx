import { useSyncExternalStore } from 'react'
import ThemeMode from 'theme-mode'

export type ThemePreference = 'light' | 'dark' | 'system' | (string & {})

interface ThemeModeSnapshot {
  preference?: ThemePreference
  value?: string
}

const serverSnapshot: ThemeModeSnapshot = {}
let themeMode: ThemeMode | undefined
let snapshot = serverSnapshot

/** One page-wide ThemeMode so every island shows and changes the same preference. */
function getThemeMode() {
  if (!themeMode) {
    themeMode = new ThemeMode({ preference: 'system' }).init()
    snapshot = { preference: themeMode.preference, value: themeMode.value }
  }
  return themeMode
}

function subscribe(onChange: () => void) {
  const instance = getThemeMode()
  const update = () => {
    snapshot = { preference: instance.preference, value: instance.value }
    onChange()
  }
  document.documentElement.addEventListener('themeModeChange', update)
  document.documentElement.addEventListener('themePreferenceChange', update)
  return () => {
    document.documentElement.removeEventListener('themeModeChange', update)
    document.documentElement.removeEventListener('themePreferenceChange', update)
  }
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

export function useThemeMode() {
  const current = useSyncExternalStore(subscribe, () => (getThemeMode(), snapshot), () => serverSnapshot)
  return {
    ...current,
    set preference(preference: ThemePreference | undefined) {
      if (preference) withoutTransitions(() => { getThemeMode().preference = preference })
    },
    get preference() {
      return current.preference
    }
  }
}
