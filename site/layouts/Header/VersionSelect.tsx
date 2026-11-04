import { useRouter } from 'next/router'

export default function VersionSelect() {
    const { locale } = useRouter()

    return (
        <select
            name="version"
            aria-label={locale === 'tw' ? '版本' : 'Version'}
            className="headerVersion"
            defaultValue="v1"
            onChange={(event) => {
                if (event.currentTarget.value === 'v2') {
                    window.location.assign(locale === 'tw' ? 'https://css.master.co/tw' : 'https://css.master.co')
                }
            }}>
            <option value="v1">v1.37.8</option>
            <option value="v2">v2.0</option>
        </select>
    )
}
