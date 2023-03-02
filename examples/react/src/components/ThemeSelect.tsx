import { useTheme } from '@master/css.react'

export default function ThemeSelect(props: any) {
    const theme = useTheme()
    return (
        <select {...props} value={theme.value} onChange={(event) => theme.set(event.target.value)}>
            <option value="light">☀️ Light</option>
            <option value="dark">🌜 Dark</option>
            <option value="system">System</option>
        </select>
    )
}