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

export function useThemeMode() {
  const current = useSyncExternalStore(subscribe, () => (getThemeMode(), snapshot), () => serverSnapshot)
  return {
    ...current,
    set preference(preference: ThemePreference | undefined) {
      if (preference) getThemeMode().preference = preference
    },
    get preference() {
      return current.preference
    }
  }
}
