import { useThemeService } from '@master/css.react'

export default function ThemeSelect(props: any) {
    const themeService = useThemeService()
    return (
        <select {...props} value={themeService.value} onChange={(event) => themeService.switch(event.target.value)}>
            <option value="light">☀️ Light</option>
            <option value="dark">🌜 Dark</option>
            <option value="system">System</option>
        </select>
    )
}